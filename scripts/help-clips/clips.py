"""The FoodScholar help clips. Usage: clips.py <clip> <lang> [desktop|phone]

Each clip is one task, 20-40 s, with captions in the interface language.
Texts live in texts.py; this file is only the choreography.
"""
import asyncio, json, os, shutil, sys, time
from lib import BASE, Browser, Director, Recorder, ensure_guest
from texts import T

WORK = os.environ.get('HELP_CLIPS_WORK', '/dev/shm/wf-help-clips')
OUT = os.path.join(WORK, 'out')
ANSWER = '[data-flows="foodscholar-qa-answer"]'
CITE = f'{ANSWER} a[data-citation-urn]'


LANG_HINT: dict = {}


class NoCitations(Exception):
    pass


# FoodScholar sometimes asks one question back before answering.
CLARIFY = {'en': ('Skip', 'Continue'), 'hu': ('Kihagyás', 'Folytatás'), 'sl': ('Preskoči', 'Nadaljuj')}
LOCAL_HINTS = ('Magyar', 'Hungar', 'Sloven', 'Nemzeti', 'national', 'National', 'nacional')


async def answer_clarification(d) -> bool:
    """Pick the national guideline if offered, else the first choice; else skip."""
    page = d.page
    skip_label, go_label = CLARIFY.get(getattr(d, 'lang', 'en'), CLARIFY['en'])
    go = page.get_by_role('button', name=go_label, exact=True)
    if not await go.count() or not await go.first.is_visible():
        return False
    card = go.first.locator('xpath=ancestor::div[.//button[normalize-space()="%s"]][2]' % skip_label)
    chips = card.locator('button').filter(has_not_text=skip_label).filter(has_not_text=go_label)
    pick = None
    for i in range(await chips.count()):
        text = await chips.nth(i).inner_text()
        if any(h in text for h in LOCAL_HINTS):
            pick = chips.nth(i)
            break
    if pick is None and await chips.count():
        pick = chips.first
    if pick is not None:
        await d.click(pick)
        await d.click(go.first)
    else:
        await d.click(page.get_by_role('button', name=skip_label, exact=True).first)
    return True


async def open_page(page, path, ready):
    await page.goto(f'{BASE}{path}', wait_until='domcontentloaded')
    await page.wait_for_function("document.getElementById('__nuxt')?.__vue_app__", timeout=60000)
    await page.wait_for_selector(ready, timeout=60000)
    await page.evaluate('document.fonts.ready')
    await page.wait_for_timeout(1800)


async def scroll_to(d, locator, offset=150):
    """Bring an element up to just under the caption bar, smoothly."""
    await locator.evaluate('(e, o) => window.scrollTo({top: e.getBoundingClientRect().top + window.scrollY - o, behavior: "smooth"})', offset)
    await d.wait(1100)


async def qa_input(page):
    box = page.locator('[data-flows="foodscholar-qa-input"]:visible').first
    inner = box.locator('textarea, input')
    return inner.first if await inner.count() else box


async def wait_answer(d: Director, nth: int = 0, timeout=150):
    """Wait for the nth answer to finish streaming, with at least one live citation."""
    page = d.page
    t0 = time.time()
    while await page.locator(ANSWER).count() <= nth:
        if time.time() - t0 > timeout:
            raise TimeoutError('no answer')
        if await answer_clarification(d):
            await d.wait(800)
        await d.wait(500)
    ans = page.locator(ANSWER).nth(nth)
    last, stable = -1, 0
    while stable < 5:
        n = await ans.evaluate('e => e.innerText.length')
        stable = stable + 1 if (n == last and n > 80) else 0
        last = n
        if time.time() - t0 > timeout:
            break
        await d.wait(500)
    # The streamed text is provisional: the settled answer (with repaired
    # citation links) replaces it on the stream's `done`, which is also when
    # the follow-up suggestions appear.
    followups = page.locator('[data-flows="foodscholar-qa-followups"]')
    for _ in range(50):
        if await followups.count() > 0:
            break
        await d.wait(500)
    await d.wait(800)
    cites = await ans.locator('a[data-citation-urn]').count()
    if not cites:
        raise NoCitations()
    return ans


# ---------------------------------------------------------------- clips

async def clip_ask(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    inp = await qa_input(page)
    await d.caption(1, t['c1'], hold=600)
    await d.type(inp, t['q'])
    await d.caption(2, t['c2'], hold=900)
    await d.click(page.locator('[data-flows="foodscholar-qa-submit"]:visible').first)
    await d.hide_caption()
    await d.fast(True, t['fast'])
    ans = await wait_answer(d)
    await d.fast(False)
    await d.caption(3, t['c3'], hold=300)
    await scroll_to(d, ans)
    await d.point(ans.locator('a[data-citation-urn]').first)
    await d.wait(1800)
    if not phone:
        await d.caption(4, t['c4'], hold=300)
        await d.point(page.locator('.citation-source-card').first)
        d.rec.mark('poster')
        await d.wait(2600)
    else:
        d.rec.mark('poster')
        await d.wait(1600)


async def prepare_sources(page, t):
    """Not recorded: ask the question, so the clip opens on an answer."""
    inp = await qa_input(page)
    await inp.click()
    await page.keyboard.type(t['q'])
    await page.keyboard.press('Enter')

    class _D:  # wait_answer only needs .page and .wait
        def __init__(self, p): self.page = p; self.phone = False; self.lang = LANG_HINT.get('lang', 'en')
        async def wait(self, ms): await self.page.wait_for_timeout(ms)
        async def click(self, loc): await loc.click()
    ans = await wait_answer(_D(page))
    await ans.evaluate('e => e.scrollIntoView({block: "start"})')
    await page.evaluate('window.scrollBy(0, -90)')
    await page.wait_for_timeout(800)


async def clip_sources(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    ans = page.locator(ANSWER).first
    await d.caption(1, t['c1'], hold=700)
    await d.click(ans.locator('a[data-citation-urn]').first)
    await page.wait_for_selector('[data-flows="foodscholar-qa-passage-peek"], [data-flows="foodscholar-qa-guideline-peek"]', timeout=20000)
    await d.wait(900)
    await d.caption(2, t['c2'], hold=600)
    d.rec.mark('poster')
    await d.wait(2600)
    await page.keyboard.press('Escape')
    await d.wait(500)
    await d.caption(3, t['c3'], hold=500)
    inp = await qa_input(page)
    first_text = await page.locator(ANSWER).first.inner_text()
    await d.type(inp, t['q2'])
    await page.keyboard.press('Enter')
    await d.fast(True, t['fast'])
    # The first answer's follow-ups go away while the second is asked.
    for _ in range(20):
        if not await page.locator('[data-flows="foodscholar-qa-followups"]').count():
            break
        await d.wait(500)
    # Only the latest answer carries the answer marker: wait for it to change.
    for _ in range(240):
        el = page.locator(ANSWER)
        if await el.count() and (await el.first.inner_text()) != first_text:
            break
        if await answer_clarification(d):
            await d.wait(800)
        await d.wait(500)
    second = await wait_answer(d, nth=0)
    await d.fast(False)
    await second.evaluate('e => e.scrollIntoView({behavior: "smooth", block: "start"})')
    await d.wait(2500)


async def clip_catalog(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    box = page.locator('[data-flows="foodscholar-catalog-search"] input, [data-flows="foodscholar-catalog-search"] textarea').first
    await d.caption(1, t['c1'], hold=600)
    await d.type(box, t['query'])
    await page.keyboard.press('Enter')
    await d.hide_caption()
    await d.fast(True, t['fast'])
    await page.wait_for_selector('[data-flows="foodscholar-catalog-summary"] .answer-reveal-ltr', timeout=120000)
    summary = page.locator('[data-flows="foodscholar-catalog-summary"]').first
    last, stable = -1, 0
    while stable < 4:
        n = await summary.evaluate('e => e.innerText.length')
        stable = stable + 1 if n == last else 0
        last = n
        await d.wait(500)
    await d.fast(False)
    await d.caption(2, t['c2'], hold=300)
    await summary.evaluate('e => e.scrollIntoView({behavior: "smooth", block: "start"})')
    await page.evaluate('window.scrollBy({top: -90, behavior: "smooth"})')
    await d.wait(800)
    await d.point(summary)
    d.rec.mark('poster')
    await d.wait(3000)
    await d.caption(3, t['c3'], hold=300)
    first = page.locator('[data-flows="foodscholar-catalog-first-result"]').first
    await first.evaluate('e => e.scrollIntoView({behavior: "smooth", block: "center"})')
    await d.wait(900)
    await d.point(first)
    await d.wait(1800)


async def clip_article(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    simplify = page.get_by_role('button', name=t['simplify_label'])
    await d.caption(1, t['c1'], hold=600)
    await d.click(simplify.first)
    await d.fast(True, t.get('fast', ''))
    try:
        await page.get_by_role('button', name=t['original_label']).first.wait_for(timeout=60000)
    finally:
        await d.fast(False)
    await d.wait(1500)
    d.rec.mark('poster')
    await d.wait(1800)
    await d.caption(2, t['c2'], hold=300)
    qa = page.get_by_text(t['qa_label'], exact=True).first
    await qa.evaluate('e => e.scrollIntoView({behavior: "smooth", block: "start"})')
    await page.evaluate('window.scrollBy({top: -110, behavior: "smooth"})')
    await d.wait(1200)
    tabs = qa.locator('xpath=ancestor::section[1]').locator('button')
    if await tabs.count() > 1:
        await d.click(tabs.nth(1))
        await d.wait(2200)
    await d.caption(3, t['c3'], hold=300)
    await d.click(page.locator('[data-flows="foodscholar-article-save"]').first)
    await d.wait(2000)


async def clip_hierarchy(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    box = page.locator('[data-flows="foodscholar-graph-search"] input').first
    await d.caption(1, t['c1'], hold=600)
    await d.type(box, t['query'], delay=80)
    await d.wait(1800)
    options = page.locator('[role="option"]')
    exact = options.filter(has_text=t['query'])
    pick = None
    for i in range(min(await options.count(), 8)):
        if (await options.nth(i).inner_text()).strip().lower() == t['query'].lower():
            pick = options.nth(i)
            break
    if pick is None and await options.count():
        pick = options.first
    if pick is not None:
        await d.click(pick)
    else:
        await page.keyboard.press('Enter')
    await d.wait(2200)
    await d.caption(2, t['c2'], hold=300)
    evidence = page.locator('[data-flows="foodscholar-graph-evidence"]').first
    if await evidence.count() and await evidence.is_visible():
        await d.click(evidence)
        await d.wait(1200)
    else:
        badge = page.get_by_text('evidence', exact=False).first
        if await badge.count():
            await d.point(badge)
    d.rec.mark('poster')
    await d.wait(3200)
    await d.caption(3, t['c3'], hold=300)
    await d.point(page.locator('[data-flows="foodscholar-graph-scope"]').first)
    await d.wait(2200)


async def clip_textbooks(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    box = page.locator('[data-flows="foodscholar-textbooks-search"] input, [data-flows="foodscholar-textbooks-search"] textarea').first
    await d.caption(1, t['c1'], hold=600)
    await d.type(box, t['query'])
    await page.keyboard.press('Enter')
    first = page.locator('[data-flows="foodscholar-textbooks-first-card"]').first
    await first.wait_for(timeout=60000)
    await d.wait(1800)
    await d.caption(2, t['c2'], hold=600)
    link = first.locator('a[href]').first
    await d.click(link if await link.count() else first)
    await page.wait_for_selector('[data-flows="foodscholar-textbook-save"]', timeout=60000)
    await d.wait(1500)
    await d.caption(3, t['c3'], hold=300)
    inside = page.locator('section:has(.i-lucide-text-quote), section:has([class*="text-quote"])').first
    if await inside.count():
        await inside.evaluate('e => e.scrollIntoView({behavior: "smooth", block: "start"})')
        await page.evaluate('window.scrollBy({top: -90, behavior: "smooth"})')
    await d.wait(1200)
    d.rec.mark('poster')
    await d.wait(2400)


COUNTRY_NAMES = {
    'IE': ['Ireland', 'Írország', 'Irska'],
    'HU': ['Hungary', 'Magyarország', 'Madžarska'],
    'SI': ['Slovenia', 'Szlovénia', 'Slovenija'],
}


SLUGS = {'IE': 'ireland', 'HU': 'hungary', 'SI': 'slovenia'}


async def region_button(page, code):
    items = page.locator('[data-flows="foodscholar-guides-region-list"] button')
    for name in COUNTRY_NAMES[code]:
        hit = items.filter(has_text=name)
        if await hit.count():
            return hit.first
    raise RuntimeError(f'no region button for {code}')


async def clip_guides_map(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    await d.caption(1, t['c1'], hold=600)
    await d.click(page.locator('[data-flows="foodscholar-guides-tab-map"]').first)
    await page.wait_for_selector('[data-flows="foodscholar-guides-region-list"]', timeout=30000)
    await d.wait(1600)
    await d.caption(2, t['c2'], hold=700)
    await d.click(await region_button(page, t['country']))
    await d.wait(1800)
    d.rec.mark('poster')
    await d.wait(1000)
    await d.caption(3, t['c3'], hold=500)
    open_link = page.locator(f'a[href$="/foodscholar/guides/{SLUGS[t["country"]]}"]').first
    await d.click(open_link)
    await page.wait_for_selector('[data-flows="foodscholar-guides-explorer-tabs"]', timeout=30000)
    await d.wait(2800)


async def clip_guides_explorer(d: Director, t, lang, phone):
    page = d.page
    await d.title('FoodScholar', t['title'])
    await d.caption(1, t['c1'], hold=600)
    await d.click(page.locator('[data-flows="foodscholar-guides-explorer-tabs"] [id$="-trigger-guidelines"]').first)
    facets = page.locator('[data-flows="foodscholar-guideline-facets"]').first
    await facets.wait_for(timeout=30000)
    await d.wait(1500)
    await d.caption(2, t['c2'], hold=300)
    boxes = facets.locator('button[role="checkbox"]')
    # 0 is "include rules with no age range"; then the life stages, largest
    # first. The second life stage narrows the list to a handful.
    target = boxes.nth(2) if await boxes.count() > 2 else boxes.first
    await scroll_to(d, target, offset=260)
    await d.click(target)
    await d.wait(1600)
    await d.caption(3, t['c3'], hold=300)
    await facets.evaluate('e => window.scrollTo({top: e.getBoundingClientRect().bottom + window.scrollY - 120, behavior: "smooth"})')
    await d.wait(1400)
    chips = facets.locator('xpath=following::*[contains(@class,"rounded-full")][1]')
    if await chips.count():
        await d.point(chips.first)
    d.rec.mark('poster')
    await d.wait(3000)


CLIPS = {
    'foodscholar-guides-map': {'path': '/foodscholar/guides', 'ready': '[data-flows="foodscholar-guides-tab-map"]',
                               'run': clip_guides_map},
    'foodscholar-guides-explorer': {'path': '/foodscholar/guides/{slug}', 'ready': '[data-flows="foodscholar-guides-explorer-tabs"]',
                                    'run': clip_guides_explorer},
    'foodscholar-textbooks': {'path': '/foodscholar/textbooks', 'ready': '[data-flows="foodscholar-textbooks-search"]',
                              'run': clip_textbooks},
    'foodscholar-hierarchy': {'path': '/foodscholar/hierarchy', 'ready': '[data-flows="foodscholar-graph-search"]',
                              'run': clip_hierarchy},
    'foodscholar-ask': {'path': '/foodscholar', 'ready': '[data-flows="foodscholar-qa-input"]', 'run': clip_ask},
    'foodscholar-sources': {'path': '/foodscholar', 'ready': '[data-flows="foodscholar-qa-input"]',
                            'prepare': prepare_sources, 'run': clip_sources},
    'foodscholar-catalog-search': {'path': '/foodscholar/catalog', 'ready': '[data-flows="foodscholar-catalog-search"]',
                                   'run': clip_catalog},
}


async def record(clip, lang, fmt='desktop', attempts=3):
    spec = CLIPS[clip]
    t = T[clip][lang]
    LANG_HINT['lang'] = lang
    phone = fmt == 'phone'
    os.makedirs(OUT, exist_ok=True)
    async with Browser(fmt) as b:
        guest = await ensure_guest(b, lang)
        for attempt in range(1, attempts + 1):
            ctx = await b.context(lang, fmt, guest)
            page = await ctx.new_page()
            raw_dir = os.path.join(WORK, 'raw')
            os.makedirs(raw_dir, exist_ok=True)

            async def keep_stream(r, _a=attempt):
                # Every answer's raw stream, to study citation markup later.
                if r.url.endswith('/ask/stream'):
                    try:
                        body = await r.text()
                    except Exception as e:
                        body = f'ERR {e}'
                    n = len([f for f in os.listdir(raw_dir) if f.startswith(f'{clip}.{lang}.')])
                    open(os.path.join(raw_dir, f'{clip}.{lang}.{_a}.{n}.txt'), 'w').write(body)
            page.on('response', keep_stream)
            try:
                await open_page(page, spec['path'].format(**t), spec['ready'])
                if spec.get('prepare'):
                    await spec['prepare'](page, t)
                rec = Recorder(page, os.path.join(WORK, 'frames', f'{clip}.{lang}.{fmt}'), fmt)
                d = Director(page, rec, phone)
                d.lang = lang
                await rec.start()
                await spec['run'](d, t, lang, phone)
                await d.hide_caption()
                await d.wait(700)
                await rec.stop()
            except (NoCitations, TimeoutError) as e:
                # Both are the answer's fault, not the script's: no clickable
                # citation, or no answer shown at all (the page has gone blank
                # on a malformed one). Playwright's own timeouts are not
                # builtin TimeoutErrors, so a broken script still stops here.
                why = 'answer without citations' if isinstance(e, NoCitations) else 'no answer shown'
                print(f'{clip}/{lang}/{fmt}: {why}, attempt {attempt}')
                await page.screenshot(path=os.path.join(OUT, f'fail-{clip}.{lang}.{fmt}.{attempt}.png'))
                await ctx.close()
                continue
            except Exception:
                await page.screenshot(path=os.path.join(OUT, f'fail-{clip}.{lang}.{fmt}.{attempt}.png'))
                await ctx.close()
                raise
            await ctx.close()
            suffix = '' if fmt == 'desktop' else '.phone'
            base = os.path.join(OUT, f'{clip}.{lang}{suffix}')
            meta = rec.encode(base + '.mp4', base + '.jpg')
            shutil.rmtree(rec.dir, ignore_errors=True)
            meta.update(clip=clip, lang=lang, fmt=fmt)
            json.dump(meta, open(base + '.json', 'w'))
            print(json.dumps(meta))
            return meta
        raise SystemExit(f'{clip}/{lang}/{fmt}: no usable answer after {attempts} attempts')


if __name__ == '__main__':
    clip, lang = sys.argv[1], sys.argv[2]
    fmt = sys.argv[3] if len(sys.argv) > 3 else 'desktop'
    asyncio.run(record(clip, lang, fmt))
