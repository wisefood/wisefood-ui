"""Scripted, re-recordable help clips for the WiseFood help panel.

Frames come from Chrome's screencast (sharp JPEGs with timestamps), not from
Playwright's VP8 recorder. Captions, a cursor and a "sped up" badge are drawn
into the page itself, so every clip carries its own language and plays the
same anywhere. Waiting for the AI is kept in the timeline but compressed.
"""
import asyncio, base64, glob, json, os, shutil, subprocess, time
from urllib.parse import urlparse
from playwright.async_api import async_playwright

ORIGIN = 'https://demo.wisefood-project.eu'
BASE = ORIGIN + '/app'
WORK = os.environ.get('HELP_CLIPS_WORK', '/dev/shm/wf-help-clips')
# Playwright's headless shell when installed (`playwright install chromium-headless-shell`),
# else Playwright's default Chromium. CHROME overrides both.
_shell = glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell'))
EXE = os.environ.get('CHROME') or (_shell[0] if _shell else None)
try:
    import imageio_ffmpeg
    FFMPEG = os.environ.get('FFMPEG') or imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = os.environ.get('FFMPEG') or shutil.which('ffmpeg') or 'ffmpeg'
# A live guest token per language. It lives in the work directory, outside the
# repository, so it cannot be committed by accident.
GUEST_FILE = os.path.join(WORK, 'guest-{key}.json')

FORMATS = {
    # 16:9, the help panel's box. 1440x810 CSS px at 4/3 = 1920x1080 frames (see Browser).
    'desktop': {'viewport': {'width': 1440, 'height': 810}, 'dpr': 4 / 3, 'mobile': False},
    # A phone held upright: 390x844 CSS px at 2 = 780x1688 frames.
    'phone': {'viewport': {'width': 390, 'height': 844}, 'dpr': 2, 'mobile': True},
}

OVERLAY_JS = r"""
(() => {
  if (window.__rec) return;
  const css = `
  .bg-amber-50.border-b.border-amber-200.px-4.py-2 { display: none !important; }
  [aria-labelledby="consent-bar-message"] { display: none !important; }
  #__rec_cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483647;
    pointer-events: none; transform: translate(-60px, -60px); }
  .__rec_ripple { position: fixed; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
    border: 3px solid var(--brand, #c2185b); z-index: 2147483646; pointer-events: none;
    animation: __rec_r .55s ease-out forwards; }
  @keyframes __rec_r { from { transform: scale(.25); opacity: .95 } to { transform: scale(1.35); opacity: 0 } }
  #__rec_cap { position: fixed; left: 50%; top: 12px; transform: translate(-50%, -8px); opacity: 0;
    transition: opacity .25s ease, transform .25s ease; z-index: 2147483645; pointer-events: none;
    display: flex; align-items: center; gap: 14px; max-width: min(980px, calc(100vw - 32px));
    background: rgba(24, 24, 27, .93); color: #fff; padding: 12px 22px 12px 14px; border-radius: 16px;
    box-shadow: 0 8px 28px rgba(0,0,0,.28); font: 600 22px/1.3 var(--font-sans, system-ui, sans-serif); }
  #__rec_cap.on { opacity: 1; transform: translate(-50%, 0); }
  #__rec_cap.bottom { top: auto; bottom: 18px; }
  #__rec_cap .n { flex: none; width: 34px; height: 34px; border-radius: 50%; background: var(--brand, #c2185b);
    display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
  #__rec_cap.nonum .n { display: none; }
  #__rec_cap.nonum { padding-left: 22px; }
  #__rec_title { position: fixed; inset: 0; z-index: 2147483644; pointer-events: none; display: flex;
    align-items: center; justify-content: center; background: rgba(255,255,255,.82);
    backdrop-filter: blur(6px); opacity: 0; transition: opacity .35s ease; }
  #__rec_title.on { opacity: 1; }
  #__rec_title .card { text-align: center; padding: 28px 40px; }
  #__rec_title .app { font: 600 18px/1 var(--font-sans, system-ui); letter-spacing: .22em; text-transform: uppercase;
    color: var(--brand, #c2185b); }
  #__rec_title .t { margin-top: 14px; font: 600 44px/1.15 var(--font-sans, system-ui); color: #18181b; }
  #__rec_fast { position: fixed; right: 18px; bottom: 18px; z-index: 2147483645; pointer-events: none;
    background: rgba(24,24,27,.85); color: #fff; padding: 8px 14px; border-radius: 999px;
    font: 600 16px/1 var(--font-sans, system-ui); display: none; align-items: center; gap: 8px; }
  #__rec_fast.on { display: flex; }
  .__rec_phone #__rec_cap { font-size: 17px; padding: 10px 14px 10px 10px; gap: 10px; border-radius: 14px; top: 8px; }
  .__rec_phone #__rec_cap .n { width: 26px; height: 26px; font-size: 14px; }
  .__rec_phone #__rec_title .t { font-size: 30px; }
  .__rec_phone #__rec_title .app { font-size: 14px; }
  .__rec_phone #__rec_cursor { display: none; }
  .__rec_phone .__rec_ripple { width: 52px; height: 52px; margin: -26px 0 0 -26px; background: rgba(0,0,0,.12); }
  `;
  const el = (id, html) => { const d = document.createElement('div'); d.id = id; d.innerHTML = html; document.documentElement.appendChild(d); return d; };
  const install = () => {
    if (document.getElementById('__rec_style')) return;
    const s = document.createElement('style'); s.id = '__rec_style'; s.textContent = css;
    document.documentElement.appendChild(s);
    if (window.__REC_PHONE) document.documentElement.classList.add('__rec_phone');
    const cur = el('__rec_cursor', '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9.5-7 1.6-3.6 6.9z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>');
    el('__rec_cap', '<span class="n"></span><span class="x"></span>');
    el('__rec_title', '<div class="card"><div class="app"></div><div class="t"></div></div>');
    el('__rec_fast', '<span>&#9193;</span><span class="x"></span>');
    const move = (x, y) => { cur.style.transform = `translate(${x - 4}px, ${y - 2}px)`; };
    document.addEventListener('mousemove', e => move(e.clientX, e.clientY), true);
    const ripple = (x, y) => { const r = document.createElement('div'); r.className = '__rec_ripple';
      r.style.left = x + 'px'; r.style.top = y + 'px'; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 700); };
    document.addEventListener('mousedown', e => ripple(e.clientX, e.clientY), true);
    document.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) ripple(t.clientX, t.clientY); }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  window.__rec = {
    caption(n, text, where) {
      install(); const c = document.getElementById('__rec_cap');
      c.querySelector('.n').textContent = n || ''; c.querySelector('.x').textContent = text;
      c.classList.toggle('nonum', !n); c.classList.toggle('bottom', where === 'bottom'); c.classList.add('on');
    },
    hideCaption() { const c = document.getElementById('__rec_cap'); c && c.classList.remove('on'); },
    title(app, text) { install(); const t = document.getElementById('__rec_title');
      t.querySelector('.app').textContent = app; t.querySelector('.t').textContent = text; t.classList.add('on'); },
    hideTitle() { const t = document.getElementById('__rec_title'); t && t.classList.remove('on'); },
    fast(on, label) { install(); const f = document.getElementById('__rec_fast');
      f.querySelector('.x').textContent = label || ''; f.classList.toggle('on', !!on); },
  };
})();
"""


def should_block(url: str) -> bool:
    """Keep recording sessions out of analytics, Sentry and Flows."""
    u = urlparse(url)
    return ('/analytics/' in u.path or 'sentry' in u.netloc or 'flows' in u.netloc
            or u.path.startswith('/app/flows') or '/rum/' in u.path)


class Browser:
    def __init__(self, fmt: str = 'desktop'):
        self.pw = None
        self.browser = None
        self.fmt = fmt

    async def __aenter__(self):
        self.pw = await async_playwright().start()
        # Without this flag the screencast starts at CSS size (1440x810) and only
        # later switches to device pixels; the flag makes every frame full size.
        scale = FORMATS[self.fmt]['dpr']
        self.browser = await self.pw.chromium.launch(
            executable_path=EXE, args=[f'--force-device-scale-factor={scale:.7f}'])
        return self

    async def __aexit__(self, *a):
        await self.browser.close()
        await self.pw.stop()

    async def context(self, lang: str, fmt: str = 'desktop', guest: dict | None = None):
        f = FORMATS[fmt]
        ctx = await self.browser.new_context(
            viewport=f['viewport'], device_scale_factor=f['dpr'], is_mobile=f['mobile'], has_touch=f['mobile'],
            locale={'en': 'en-GB', 'hu': 'hu-HU', 'sl': 'sl-SI'}[lang],
            user_agent=None)
        await ctx.add_cookies([{'name': 'wisefood_locale', 'value': lang, 'url': ORIGIN + '/'}])

        async def route(r):
            if should_block(r.request.url):
                await r.abort()
            else:
                await r.continue_()
        await ctx.route('**/*', route)
        init = ''
        if fmt == 'phone':
            init += 'window.__REC_PHONE = true;\n'
        # Mark every help page as seen so the amber "new" dot stays off.
        init += "try { localStorage.setItem('wisefood_locale', %s) } catch (e) {}\n" % json.dumps(lang)
        if guest:
            init += "try { sessionStorage.setItem('wisefood_guest_session', %s) } catch (e) {}\n" % json.dumps(json.dumps(guest))
            # The guest's own profile is chosen, so no page detours through /profiles.
            if guest.get('memberId'):
                init += "try { localStorage.setItem('wisefood_selected_member_id', %s) } catch (e) {}\n" % json.dumps(guest['memberId'])
        await ctx.add_init_script(init + OVERLAY_JS)
        return ctx


async def ensure_guest(b: Browser, key: str = 'en') -> dict:
    """One guest per language, reused across runs: the demo allows 5 new guests
    per IP per hour and 20 FoodScholar questions per guest per day."""
    path = GUEST_FILE.format(key=key)
    if os.path.exists(path):
        g = json.load(open(path))
        if g.get('guestExpiresAt', 0) > time.time() + 3600 and g.get('tokenExpiresAt', 0) > time.time() + 600:
            return g
    ctx = await b.context('en')
    page = await ctx.new_page()
    await page.goto(f'{BASE}/login', wait_until='domcontentloaded')
    await page.wait_for_function("document.getElementById('__nuxt')?.__vue_app__", timeout=60000)
    await page.locator('button:has([class*="flask-conical"])').first.click()
    await page.wait_for_url('**/dashboard**', timeout=60000)
    await page.wait_for_timeout(2500)
    # Accept the terms once for this guest; the answer is stored server-side.
    accept = page.locator('[aria-labelledby="consent-bar-message"] button').last
    if await accept.count():
        await accept.evaluate('b => b.click()')
        await page.wait_for_timeout(1500)
    raw = await page.evaluate("sessionStorage.getItem('wisefood_guest_session')")
    await ctx.close()
    g = json.loads(raw)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Owner-only: the token signs in as this guest, and the server is shared.
    with open(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w') as fh:
        json.dump(g, fh)
    return g


class Recorder:
    """Screencast frames + markers on one clock (epoch seconds)."""

    def __init__(self, page, workdir: str, fmt: str):
        self.page = page
        self.dir = workdir
        self.fmt = fmt
        self.frames: list[tuple[float, str]] = []
        self.marks: list[tuple[float, str]] = []
        # What the viewer is told, and when: the voice-over is timed from these.
        self.cues: list[tuple[float, str, str, str]] = []
        self.fast: list[list[float]] = []
        self.cdp = None
        self.t_end = None

    async def start(self):
        shutil.rmtree(self.dir, ignore_errors=True)
        os.makedirs(self.dir)
        self.cdp = await self.page.context.new_cdp_session(self.page)
        vp = FORMATS[self.fmt]['viewport']
        dpr = FORMATS[self.fmt]['dpr']

        def on_frame(p):
            ts = p['metadata'].get('timestamp') or time.time()
            name = os.path.join(self.dir, f'f{len(self.frames):05d}.jpg')
            with open(name, 'wb') as fh:
                fh.write(base64.b64decode(p['data']))
            self.frames.append((ts, name))
            asyncio.ensure_future(self.cdp.send('Page.screencastFrameAck', {'sessionId': p['sessionId']}))
        self.cdp.on('Page.screencastFrame', on_frame)
        await self.cdp.send('Page.startScreencast', {
            'format': 'jpeg', 'quality': 92,
            'maxWidth': round(vp['width'] * dpr), 'maxHeight': round(vp['height'] * dpr), 'everyNthFrame': 1})
        await self.page.wait_for_timeout(400)

    def mark(self, kind: str):
        self.marks.append((time.time(), kind))

    def cue(self, kind: str, n: str = '', text: str = ''):
        """A title or caption appearing (or the caption going away)."""
        self.cues.append((time.time(), kind, n, text))

    def fast_on(self):
        self.fast.append([time.time(), None])

    def fast_off(self):
        if self.fast and self.fast[-1][1] is None:
            self.fast[-1][1] = time.time()

    async def stop(self):
        self.fast_off()
        await self.page.wait_for_timeout(300)
        self.t_end = time.time()
        await self.cdp.send('Page.stopScreencast')
        await self.page.wait_for_timeout(300)

    # ------------------------------------------------------------ encode
    def remap(self, factor: float):
        """Output time for an input time: fast windows play `factor` times quicker."""
        t0 = self.frames[0][0]

        def f(t):
            out = t - t0
            for a, b in self.fast:
                if t <= a:
                    continue
                span = min(t, b) - a
                out -= span - span / factor
            return out
        return f

    def encode(self, out_mp4: str, poster_jpg: str, factor: float = 8.0, crf: int = 25) -> dict:
        assert self.frames, 'no frames captured'
        f = self.remap(factor)
        frames = sorted(self.frames)
        lst = os.path.join(self.dir, 'list.ffconcat')
        with open(lst, 'w') as fh:
            fh.write('ffconcat version 1.0\n')
            for i, (t, name) in enumerate(frames):
                nxt = frames[i + 1][0] if i + 1 < len(frames) else self.t_end
                d = max(f(nxt) - f(t), 0.001)
                fh.write(f"file '{os.path.basename(name)}'\nduration {d:.4f}\n")
            fh.write(f"file '{os.path.basename(frames[-1][1])}'\n")
        # Frames can change size mid-recording; size the video from the largest.
        w, h = max((self._size(frames[0][1]), self._size(frames[len(frames) // 2][1]), self._size(frames[-1][1])),
                   key=lambda wh: wh[0] * wh[1])
        vf = f'fps=30,scale={w - w % 2}:{h - h % 2}:flags=lanczos,format=yuv420p'
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
                        '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-tune', 'stillimage',
                        '-movflags', '+faststart', '-an', out_mp4], check=True, cwd=self.dir)
        # Poster: the frame at the 'poster' mark, else the last frame.
        pt = next((t for t, k in reversed(self.marks) if k == 'poster'), None)
        pick = frames[-1][1]
        if pt is not None:
            before = [n for t, n in frames if t <= pt]
            pick = before[-1] if before else pick
        pw = 1280 if w > h else 720
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', pick, '-vf', f'scale={pw}:-2:flags=lanczos',
                        '-q:v', '4', poster_jpg], check=True)
        dur = f(self.t_end)
        t0 = frames[0][0]
        cues = [{'t': round(max(f(t), 0.0), 2), 'kind': k, 'n': n, 'text': x}
                for t, k, n, x in self.cues if t >= t0 - 1]
        fast = [[round(f(a), 2), round(f(b if b is not None else self.t_end), 2)] for a, b in self.fast]
        return {'duration': round(dur), 'seconds': round(dur, 2), 'width': w - w % 2, 'height': h - h % 2,
                'bytes': os.path.getsize(out_mp4), 'cues': cues, 'fast': fast}

    @staticmethod
    def _size(jpg):
        out = subprocess.run([FFMPEG, '-hide_banner', '-i', jpg], capture_output=True, text=True).stderr
        import re
        m = re.search(r', (\d{2,5})x(\d{2,5})', out)
        return int(m.group(1)), int(m.group(2))


class Director:
    """The on-screen hand: cursor moves, clicks, typing, captions, pacing."""

    def __init__(self, page, rec: Recorder, phone: bool):
        self.page = page
        self.rec = rec
        self.phone = phone
        self.x, self.y = 700, 500

    async def wait(self, ms):
        await self.page.wait_for_timeout(ms)

    async def title(self, app, text, ms=1900):
        await self.page.evaluate('([a, t]) => window.__rec.title(a, t)', [app, text])
        self.rec.cue('title', '', text)
        await self.wait(ms)
        await self.page.evaluate('window.__rec.hideTitle()')
        await self.wait(450)

    async def caption(self, n, text, where='top', hold=1500):
        await self.page.evaluate('([n, t, w]) => window.__rec.caption(n, t, w)', [str(n) if n else '', text, where])
        self.rec.cue('caption', str(n) if n else '', text)
        await self.wait(hold)

    async def hide_caption(self):
        await self.page.evaluate('window.__rec.hideCaption()')
        self.rec.cue('hide')

    async def point(self, locator, steps=28):
        await locator.scroll_into_view_if_needed()
        box = await locator.bounding_box()
        x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        if not self.phone:
            await self.page.mouse.move(x, y, steps=steps)
        self.x, self.y = x, y
        await self.wait(250)
        return x, y

    async def click(self, locator, pause=350):
        x, y = await self.point(locator)
        if self.phone:
            await self.page.touchscreen.tap(x, y)
        else:
            await self.page.mouse.click(x, y)
        await self.wait(pause)

    async def type(self, locator, text, delay=55):
        await self.click(locator)
        await self.page.keyboard.type(text, delay=delay)
        await self.wait(500)

    async def scroll(self, dy, steps=12):
        for _ in range(steps):
            await self.page.mouse.wheel(0, dy / steps)
            await self.wait(35)
        await self.wait(300)

    async def fast(self, on, label=''):
        await self.page.evaluate('([o, l]) => window.__rec.fast(o, l)', [on, label])
        if on:
            self.rec.fast_on()
        else:
            self.rec.fast_off()
