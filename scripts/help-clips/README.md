# Help clips

Records the help panel's short clips against the demo, one task per clip, in
each interface language, and can add a spoken voice-over. When the interface
changes, re-run the clip instead of redoing it by hand.

```sh
pip install playwright imageio-ffmpeg     # ffmpeg with libx264 comes with imageio-ffmpeg
playwright install chromium-headless-shell

python clips.py foodscholar-ask en        # → $HELP_CLIPS_WORK/out/foodscholar-ask.en.{mp4,jpg,json}
python clips.py foodscholar-ask hu
python vo.py                              # voiced copies → $HELP_CLIPS_WORK/out-vo/ (see Voice-over)
python manifest.py $HELP_CLIPS_WORK/out-vo
mc cp --recursive $HELP_CLIPS_WORK/out-vo/ wisefood/help-media/   # the demo's clips (public read)
```

`HELP_CLIPS_WORK` defaults to `/dev/shm/wf-help-clips`: frames are large and
short-lived. Other settings: `CHROME` (a Chrome binary), `FFMPEG` (an ffmpeg
binary). On a server without Chrome's system libraries, point
`LD_LIBRARY_PATH` at a folder that has them.

## What a clip looks like

- 1920×1080 H.264 at 30 fps (a 1440×810 page at a 4/3 pixel ratio), a 1280×720
  JPG poster of the result, silent until `vo.py` adds a voice.
- The instructions are drawn into the page in the interface language: a caption
  bar at the top (the player's controls sit at the bottom), a cursor, a ripple
  on each click, and a title card naming the help feature.
- Waiting for the AI stays in the clip but plays 8× faster, with a badge saying so.
- Frames come from Chrome's screencast, which is sharper than Playwright's VP8
  recorder. Chrome starts with `--force-device-scale-factor`: without it the
  screencast begins at CSS size and the clip came out at 1440×810.
- Each clip's `.json` lists its `cues`: when the title and every caption
  appear, in seconds of the finished video. The voice-over is timed from them.

## Files

| File | What it holds |
|---|---|
| `clips.py` | The choreography of each clip: what to click, when to caption. |
| `texts.py` | Every word on screen, per language, and optional spoken versions (`vo_title`, `vo1`, …). |
| `lib.py` | Browser, guest login, the overlay, the screencast recorder, the encoder. |
| `vo.py` | The ElevenLabs voice-over: speaks each cue, mixes, writes voiced copies. |
| `manifest.py` | Builds `manifest.json`: English is the default, other languages go under `locales`; voiced clips get `audio: true`. |

## Voice-over

```sh
mkdir -p ~/.config/elevenlabs && read -rs -p 'ElevenLabs key: ' k \
  && printf '%s' "$k" > ~/.config/elevenlabs/api_key && chmod 600 ~/.config/elevenlabs/api_key
python vo.py --voices        # the account's voices; ELEVENLABS_VOICE_ID_EN / _HU / _SL overrides one
python vo.py --dry-run       # the timing plan from estimated lengths, no API calls
python vo.py                 # every clip, each line in sync with its caption
```

- The model is `eleven_v3`, the one ElevenLabs model that speaks Slovenian as
  well as Hungarian and English.
- Each language has a native voice (`VOICES` in `vo.py`): Alice (English),
  Noémi (Hungarian, from the voice library) and a Slovenian voice made with
  Voice Design, because the library has no Slovenian voice. Only Alice is on
  every account; the other two live on the WiseFood ElevenLabs account.
- Each line starts just after its caption appears. A line that runs long
  pushes the next one later, and the report says by how much; if the voice
  outlasts the picture, the last frame is held.
- By default a line is the caption's own text. Add `vo1`, `vo2`, … (and
  `vo_title`) to a clip's language in `texts.py` for a fuller spoken version;
  an empty string keeps that cue silent.
- Audio is cached in `$HELP_CLIPS_WORK/tts-cache` by text, voice and settings,
  so a re-run only pays for the lines that changed.
- The help panel starts every clip muted, so it can start by itself. Voiced
  clips get a sound button (and the M key), and sound stays on for the next
  clips once turned on.

## Limits on the demo

- **5 new guests per IP per hour.** The recorder keeps one guest per language
  in `$HELP_CLIPS_WORK/guest-<lang>.json` (readable only by you: it holds a live
  token) and reuses it until its token runs out.
- **20 FoodScholar questions per guest per day.** A clip that asks a question
  and gets no clickable citation, or no answer at all, tries again (3 times by
  default), which uses more.
- **25 requests per second per IP.** Run one recording at a time.

Recording blocks analytics, Sentry and Flows requests, so test sessions don't
show up in the demo's insights.

## Hungarian and Slovenian

The captions, and so the voice-over, use the informal address of the help text
and need a native speaker's read, like the help text itself. Some pages still
have English text in every language (the textbook page, the guides map's
country panel, FoodScholar's follow-up box); those show in English in the clips
too. Article search finds nothing for Hungarian or Slovenian queries, so the
catalog clip is English only and those languages fall back to it.
