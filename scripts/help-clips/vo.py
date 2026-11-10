"""Voice-over for the help clips, spoken by ElevenLabs.

Each recording's .json lists when its title card and captions appear (`cues`,
in seconds of the finished video). This script has ElevenLabs speak each one in
the clip's language, starts every line just after its caption appears, mixes
the lines into one track and writes a voiced copy of the clip. The silent
originals are left alone.

    # The key: ELEVENLABS_API_KEY, or a file readable only by you (default
    # ~/.config/elevenlabs/api_key; ELEVENLABS_API_KEY_FILE names another).
    python vo.py --voices                    # the voices on the account, to pick one
    python vo.py --dry-run                   # timing plan from estimated lengths; no API calls
    python vo.py                             # every recording in out/ → out-vo/
    python vo.py foodscholar-ask --lang hu   # one clip, one language
    python manifest.py $HELP_CLIPS_WORK/out-vo

What is said: the caption text itself, unless texts.py gives a spoken version
for that clip and language: `vo_title` for the title card, `vo1`, `vo2`, ... for
captions 1, 2, ... An empty string keeps that cue silent.

Sound and picture stay in sync: a line runs while its caption is on screen.
A line too long for that is asked for again, a little faster (up to 1.12x);
if it still runs over, the picture holds its frame just before the next
caption until the line is done. `--no-fit` turns both off.

Audio is cached in $HELP_CLIPS_WORK/tts-cache by text, voice, model and
settings, so re-running after a wording change only pays for changed lines.
"""
import argparse, glob, hashlib, json, os, re, shutil, subprocess, sys, urllib.error, urllib.request, wave

WORK = os.environ.get('HELP_CLIPS_WORK', '/dev/shm/wf-help-clips')
API = 'https://api.elevenlabs.io/v1'
# eleven_v3 is the one ElevenLabs model that speaks Slovenian as well as
# Hungarian and English (multilingual_v2 has neither, flash_v2_5 lacks Slovenian).
MODEL = os.environ.get('ELEVENLABS_MODEL', 'eleven_v3')
# A native voice per language; ELEVENLABS_VOICE_ID_EN (_HU, _SL) overrides one.
# Only Alice is a premade voice every account has: the other two were added to
# the WiseFood account, so another account must add or design its own.
VOICES = {
    'en': 'Xb7hH8MSUJpSbSDYk0k2',   # Alice - Clear, Engaging Educator (British; premade)
    'hu': '3w3wekuD5gl2p2VY6XPZ',   # Noémi: native Hungarian, Budapest (voice library)
    # The voice library has no Slovenian voice, so this one was made with Voice
    # Design (eleven_ttv_v3): "a native Slovenian woman from Ljubljana, standard
    # Slovenian, no foreign accent". Its siblings: zYD2GToMB2TTQeh9n9XN (A),
    # VVmAIeR4QMYIt8BCSb0b (C).
    'sl': 'TNSxynE7FUCQk454Rvch',   # WiseFood help SL - Slovenka B
}

LEAD = 0.25   # s after a caption appears before its line starts
GAP = 0.25    # s of breath between two lines
TAIL = 0.8    # s after the last line before the clip ends
MAX_SPEED = 1.12   # faster than this stops sounding natural; a hold makes up the rest
CPS = {'en': 15.0, 'hu': 14.0, 'sl': 14.0}   # characters per second, for --dry-run


def ffmpeg() -> str:
    if os.environ.get('FFMPEG'):
        return os.environ['FFMPEG']
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    try:   # the recorder's own lookup
        from lib import FFMPEG
        return FFMPEG
    except Exception:
        return shutil.which('ffmpeg') or sys.exit('ffmpeg not found: pip install imageio-ffmpeg')


FF = None


KEY_FILE = os.environ.get('ELEVENLABS_API_KEY_FILE', os.path.expanduser('~/.config/elevenlabs/api_key'))


def api_key() -> str:
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key and os.path.exists(KEY_FILE):
        if os.stat(KEY_FILE).st_mode & 0o077:
            sys.exit(f'{KEY_FILE} is readable by others: chmod 600 it.')
        key = open(KEY_FILE).read().strip()
    if not key:
        sys.exit(f'No ElevenLabs key: set ELEVENLABS_API_KEY or put it in {KEY_FILE} (or use --dry-run).')
    return key


def request(method: str, path: str, body: dict | None = None, accept: str = 'application/json') -> bytes:
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'xi-api-key': api_key(), 'Content-Type': 'application/json', 'Accept': accept})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def list_voices():
    data = json.loads(request('GET', '/voices'))
    for v in sorted(data.get('voices', []), key=lambda v: (v.get('category', ''), v['name'])):
        labels = ', '.join(f'{k}: {x}' for k, x in (v.get('labels') or {}).items())
        print(f"{v['voice_id']}  {v['name']:24} {v.get('category', ''):12} {labels}")


# ----------------------------------------------------------------- speech
def speak(text: str, lang: str, voice: str, speed: float, stability: float) -> str:
    """A trimmed mono WAV of `text`, from the cache or from ElevenLabs."""
    settings = {'stability': stability, 'similarity_boost': 0.75, 'style': 0.0, 'use_speaker_boost': True}
    if abs(speed - 1.0) > 0.005:
        settings['speed'] = round(speed, 2)
    body = {'text': text, 'model_id': MODEL, 'language_code': lang, 'voice_settings': settings, 'seed': 7}
    key = hashlib.sha1(json.dumps([voice, body], sort_keys=True).encode()).hexdigest()[:16]
    cache = os.path.join(WORK, 'tts-cache')
    os.makedirs(cache, exist_ok=True)
    mp3, wav = os.path.join(cache, key + '.mp3'), os.path.join(cache, key + '.wav')
    if not os.path.exists(wav):
        if not os.path.exists(mp3):
            try:
                audio = request('POST', f'/text-to-speech/{voice}?output_format=mp3_44100_128', body, 'audio/mpeg')
            except urllib.error.HTTPError as e:
                detail = e.read().decode(errors='replace')[:300]
                if 'speed' in settings and e.code in (400, 422):
                    print(f'    speed not accepted ({e.code}); asking at normal speed')
                    return speak(text, lang, voice, 1.0, stability)
                sys.exit(f'ElevenLabs {e.code}: {detail}')
            open(mp3, 'wb').write(audio)
            json.dump({'voice': voice, **body}, open(os.path.join(cache, key + '.json'), 'w'), ensure_ascii=False)
        # Trim the silence ElevenLabs leaves at both ends, so timing is exact.
        trim = 'silenceremove=start_periods=1:start_threshold=-50dB'
        subprocess.run([FF, '-y', '-loglevel', 'error', '-i', mp3, '-af', f'{trim},areverse,{trim},areverse',
                        '-ar', '44100', '-ac', '1', wav], check=True)
    return wav


def wav_seconds(path: str) -> float:
    with wave.open(path) as w:
        return w.getnframes() / w.getframerate()


# ----------------------------------------------------------------- script
def lines_for(meta: dict, texts: dict, with_title: bool) -> list[dict]:
    """The lines to speak: one per title card and caption, in order."""
    t = texts.get(meta['clip'], {}).get(meta['lang'], {})
    cues = [c for c in meta['cues'] if c['kind'] in ('title', 'caption')]
    out = []
    for i, c in enumerate(cues):
        if c['kind'] == 'title' and not with_title:
            continue
        key = 'vo_title' if c['kind'] == 'title' else f"vo{c['n']}"
        say = t.get(key, c['text'])
        if not say:
            continue
        nxt = cues[i + 1]['t'] if i + 1 < len(cues) else meta['seconds']
        out.append({'cue': c['t'], 'until': nxt, 'text': say.strip(), 'label': key})
    return out


def plan(lines: list[dict], hold: bool = True) -> tuple[float, list[tuple[float, float]]]:
    """Place the lines; return when the last one ends and the holds needed.

    With `hold`, sound and picture never drift: when a line is still speaking
    as the next caption is due, the picture holds its frame just before that
    caption until the line is done (a hold is (time in the source video,
    seconds)), and everything after it moves later by as much. Without it, a
    long line pushes the next one later instead.
    """
    end, shift, holds = 0.0, 0.0, []
    for i, ln in enumerate(lines):
        ln['start'] = round(max(ln['cue'] + shift + LEAD, end + GAP if end else 0), 2)
        ln['end'] = round(ln['start'] + ln['dur'], 2)
        ln['late'] = round(ln['start'] - (ln['cue'] + shift + LEAD), 2)
        ln['over'] = round(ln['end'] - (ln['until'] + shift), 2)
        last = i == len(lines) - 1
        if hold and not last and ln['end'] + GAP > ln['until'] + shift:
            need = round(ln['end'] + GAP - (ln['until'] + shift), 2)
            holds.append((ln['until'], need))
            shift += need
            ln['held'] = need
            ln['over'] = 0.0
        end = ln['end']
    return end, holds


def report(name: str, lines: list[dict], end: float, video: float, holds=()):
    video = video + sum(d for _, d in holds)
    print(f'{name}  ({video:.1f} s video)')
    for i, ln in enumerate(lines):
        flag = []
        if ln['late'] > 0.5:
            flag.append(f"starts {ln['late']:.1f} s late")
        if ln['over'] > 0.3:
            where = 'past the end of the clip' if i == len(lines) - 1 else 'into the next caption'
            flag.append(f"runs {ln['over']:.1f} s {where}")
        speed = f" @{ln['speed']:.2f}x" if ln.get('speed', 1.0) != 1.0 else ''
        if ln.get('held'):
            flag.append(f"picture holds {ln['held']:.1f} s for it")
        print(f"  {ln['start']:5.1f}-{ln['end']:5.1f}  {ln['label']:9}{speed:7} {ln['text'][:60]}"
              + (f"   ← {'; '.join(flag)}" if flag else ''))
    if end + TAIL > video:
        print(f'  holds the last frame {end + TAIL - video:.1f} s longer')


# ----------------------------------------------------------------- mixing
def mux(src: str, dst: str, lines: list[dict], video: float, holds=()) -> float:
    held = sum(d for _, d in holds)
    total = max(video + held, lines[-1]['end'] + TAIL) if lines else video + held
    cmd = [FF, '-y', '-loglevel', 'error', '-i', src]
    parts, labels = [], []
    for k, ln in enumerate(lines, start=1):
        cmd += ['-i', ln['wav']]
        ms = int(round(ln['start'] * 1000))
        parts.append(f'[{k}:a]adelay={ms}:all=1[l{k}]')
        labels.append(f'[l{k}]')
    voice = f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest," if len(labels) > 1 else labels[0]
    parts.append(f'{voice}loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100,apad[a]')
    tail = total - (video + held)
    hold = bool(holds) or tail > 0.05
    if hold:
        # Cut the picture at each hold, freeze each piece's last frame for its
        # hold (and the last piece for the voice's tail), and join them again.
        cuts = [0.0] + [t for t, _ in holds] + [video]
        pads = [d for _, d in holds] + [max(tail, 0.0)]
        n = len(pads)
        parts.append(f"[0:v]split={n}" + ''.join(f'[s{k}]' for k in range(n)))
        for k in range(n):
            parts.append(f'[s{k}]trim=start={cuts[k]:.3f}:end={cuts[k + 1]:.3f},setpts=PTS-STARTPTS,'
                         f'tpad=stop_mode=clone:stop_duration={pads[k]:.3f}[v{k}]')
        parts.append(''.join(f'[v{k}]' for k in range(n)) + f'concat=n={n}:v=1:a=0[v]')
    cmd += ['-filter_complex', ';'.join(parts), '-map', '[v]' if hold else '0:v', '-map', '[a]']
    if hold:
        cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-tune', 'stillimage', '-pix_fmt', 'yuv420p']
    else:
        cmd += ['-c:v', 'copy']
    cmd += ['-c:a', 'aac', '-b:a', '128k', '-ac', '1', '-t', f'{total:.2f}', '-movflags', '+faststart', dst]
    subprocess.run(cmd, check=True)
    return total


# ----------------------------------------------------------------- main
def main():
    global FF
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('clips', nargs='*', help='clip ids (default: every recording found)')
    ap.add_argument('--lang', help='only these languages, e.g. en,hu')
    ap.add_argument('--src', default=os.path.join(WORK, 'out'))
    ap.add_argument('--dst', default=os.path.join(WORK, 'out-vo'))
    ap.add_argument('--speed', type=float, default=1.0, help='speaking speed for every line (0.7-1.2)')
    ap.add_argument('--stability', type=float, default=0.5, help='eleven_v3 takes 0.0, 0.5 or 1.0')
    ap.add_argument('--no-fit', dest='fit', action='store_false',
                    help="don't speed up lines that overrun their caption (they then push later lines)")
    ap.add_argument('--no-title', action='store_true', help="don't speak the title card")
    ap.add_argument('--dry-run', action='store_true', help='plan with estimated lengths; no API calls, no files')
    ap.add_argument('--voices', action='store_true', help='list the voices on the account and stop')
    a = ap.parse_args()
    if a.voices:
        return list_voices()
    FF = ffmpeg()
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from texts import T

    langs = set(a.lang.split(',')) if a.lang else None
    metas = []
    for p in sorted(glob.glob(os.path.join(a.src, '*.json'))):
        if p.endswith('manifest.json'):
            continue
        m = json.load(open(p))
        if a.clips and m['clip'] not in a.clips or langs and m['lang'] not in langs or m.get('fmt') != 'desktop':
            continue
        if not m.get('cues'):
            print(f"skip {m['clip']}.{m['lang']}: recorded before cues were logged; record it again")
            continue
        metas.append((p, m))
    if not metas:
        sys.exit(f'No recordings with cues in {a.src}.')
    os.makedirs(a.dst, exist_ok=True)

    for p, m in metas:
        stem = os.path.basename(p)[:-5]
        voice = os.environ.get(f"ELEVENLABS_VOICE_ID_{m['lang'].upper()}") or VOICES.get(m['lang'])
        if not voice:
            sys.exit(f"No voice for {m['lang']}: add it to VOICES or set ELEVENLABS_VOICE_ID_{m['lang'].upper()}.")
        video = m.get('seconds', m['duration'])
        lines = lines_for(m, T, not a.no_title)
        for ln in lines:
            ln['speed'] = a.speed
            if a.dry_run:
                ln['dur'] = round(len(ln['text']) / CPS.get(m['lang'], 14.0) / a.speed, 2)
            else:
                ln['wav'] = speak(ln['text'], m['lang'], voice, a.speed, a.stability)
                ln['dur'] = round(wav_seconds(ln['wav']), 2)
        if a.fit and not a.dry_run:
            for ln in lines[:-1]:
                room = ln['until'] - ln['cue'] - LEAD - GAP
                if ln['dur'] > room > 0:
                    ln['speed'] = min(MAX_SPEED, round(a.speed * ln['dur'] / room + 0.02, 2))
                    ln['wav'] = speak(ln['text'], m['lang'], voice, ln['speed'], a.stability)
                    ln['dur'] = round(wav_seconds(ln['wav']), 2)
        end, holds = plan(lines, hold=a.fit)
        report(stem + (' (estimated)' if a.dry_run else ''), lines, end, video, holds)
        if a.dry_run or not lines:
            continue
        drift = [ln for ln in lines if ln['late'] > 0.3 or ln['over'] > 0.3]
        if a.fit and drift:   # cannot happen with holds; a guard against planner bugs
            print(f"  OUT OF SYNC: {', '.join(ln['label'] for ln in drift)}; not written")
            continue
        dst = os.path.join(a.dst, stem + '.mp4')
        total = mux(os.path.join(a.src, stem + '.mp4'), dst, lines, video, holds)
        shutil.copy(os.path.join(a.src, stem + '.jpg'), os.path.join(a.dst, stem + '.jpg'))
        out = dict(m, duration=round(total), seconds=round(total, 2), bytes=os.path.getsize(dst), audio=True,
                   voice={'model': MODEL, 'voice_id': voice}, holds=[list(h) for h in holds],
                   lines=[{k: ln[k] for k in ('start', 'end', 'text')} for ln in lines])
        json.dump(out, open(os.path.join(a.dst, stem + '.json'), 'w'), ensure_ascii=False)
        print(f'  → {dst}')


if __name__ == '__main__':
    main()
