"""Build manifest.json from the recorded clips in out/ (one <clip>.<lang>[.phone].json each).

English is the default recording; other languages go under `locales`, phone
recordings under `phone`. Usage: manifest.py [out_dir]
"""
import glob, json, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get('HELP_CLIPS_WORK', '/dev/shm/wf-help-clips'), 'out')
DEFAULT = 'en'

metas = [json.load(open(p)) for p in sorted(glob.glob(os.path.join(OUT, '*.json'))) if not p.endswith('manifest.json')]
videos: dict = {}


def rec(m):
    stem = f"{m['clip']}.{m['lang']}{'' if m['fmt'] == 'desktop' else '.phone'}"
    r = {'src': f'{stem}.mp4', 'poster': f'{stem}.jpg', 'duration': m['duration'],
         'width': m['width'], 'height': m['height']}
    if m.get('audio'):   # voiced by vo.py: the player offers sound
        r['audio'] = True
    return r


for fmt in ('desktop', 'phone'):
    for m in metas:
        if m['fmt'] != fmt:
            continue
        clip = videos.setdefault(m['clip'], {})
        target = clip if fmt == 'desktop' else clip.setdefault('phone', {})
        r = rec(m)
        if m['lang'] == DEFAULT:
            target.update(r)
        else:
            own = {k: v for k, v in r.items() if k not in ('width', 'height')}
            target.setdefault('locales', {})[m['lang']] = own

# A clip needs a default desktop recording; a phone variant needs its own default.
for cid, clip in list(videos.items()):
    if 'src' not in clip:
        print(f'skip {cid}: no English desktop recording')
        del videos[cid]
        continue
    phone = clip.get('phone')
    if phone and 'src' not in phone:
        print(f'drop phone variant of {cid}: no English phone recording')
        del clip['phone']

json.dump({'videos': videos}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=2, ensure_ascii=False)
for cid, clip in videos.items():
    langs = ['en'] + sorted(clip.get('locales', {}))
    plangs = (['en'] + sorted(clip['phone'].get('locales', {}))) if 'phone' in clip else []
    print(f"{cid:30s} desktop {','.join(langs):10s} phone {','.join(plangs) or '-'}")
