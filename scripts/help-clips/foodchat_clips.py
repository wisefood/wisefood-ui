"""The FoodChat help clips: the choreography of each clip.

Registered into clips.CLIPS, so `clips.py foodchat-refine en`, vo.py and
manifest.py treat them like the FoodScholar clips. Texts are in
texts_foodchat.py; button labels come from the UI's locale files (LABELS).

Two kinds of clip:
- start-page clips (a plan made on camera) open a new, empty conversation from
  the dashboard, which shows FoodChat's start screen;
- plan clips (tools, save and share, adapt, refine, adjust) open a plan the
  language's guest already has. The plan is made once per guest, off camera,
  and kept in $HELP_CLIPS_WORK/fc-plan-<lang>.json; the clip opens it from the
  dashboard by navigating inside the app (/foodchat?session=…), as a person
  clicking through would.

FoodChat's AI work is waited for by watching its own requests (Busy): a clip
waits until a FoodChat POST has started and none is left in flight, and, where
FoodChat builds the plan after answering (compose), until the plan is on
screen. Recordings
here must run under isolated.py: a plan streams for a minute or two, and Chrome
drops it whenever the host's network interfaces change.
"""
import json, os, time

from lib import BASE, ORIGIN, Director
from clips import CLIPS, LANG_HINT, WORK, scroll_to

HERE = os.path.dirname(os.path.abspath(__file__))
LOCALES = os.path.join(HERE, '..', '..', 'app', 'i18n', 'locales')
_LOCALE: dict = {}


def L(lang: str, key: str) -> str:
    """A label from the UI's locale file, e.g. L('hu', 'foodChatHome.mealCard.swap')."""
    if lang not in _LOCALE:
        _LOCALE[lang] = json.load(open(os.path.join(LOCALES, f'{lang}.json'), encoding='utf-8'))
    v = _LOCALE[lang]
    for part in key.split('.'):
        v = v[part]
    return v


LABEL_KEYS = {
    'swap': 'foodChatHome.mealCard.swap',
    'adapt': 'foodChatHome.mealCard.adapt',
    'buy': 'foodChatHome.tools.shoppingList',
    'more': 'foodChatHome.tools.label',
    'totals': 'foodChatHome.tools.planTotals',
    'adjust': 'foodChatHome.builtAround.adjust',
    'update': 'foodChatHome.adjust.update',
    'protein': 'foodChatHome.chat.planParams.options.high_protein',
    'save': 'foodChatHome.planHeader.savePlan',
    'saved': 'foodChatHome.planHeader.savedPlan',
    'unsave': 'foodChatHome.planHeader.unsavePlan',
    'copy': 'share.copy',
    'revoke': 'share.revoke',
    'done': 'share.done',
    'pick': 'foodChatHome.startKitchen.pick',
    'use': 'foodChatHome.pantryPicker.keep',
    'entry': 'foodChatHome.manual.entry',
    'add_recipe': 'foodChatHome.manual.addRecipe',
    'fill': 'foodChatHome.manual.fillRest',
    'built': 'foodChatHome.builtAround.label',
    'adapt_save': 'foodChatHome.adaptModal.save',
}


def LABELS(lang: str) -> dict:
    return {k: L(lang, v) for k, v in LABEL_KEYS.items()}


def cap(t: dict, key: str, lang: str) -> str:
    return t[key].format(**LABELS(lang))


# ------------------------------------------------------------------ waiting
class Busy:
    """FoodChat requests in flight, so a clip waits exactly as long as the AI works."""

    def __init__(self, page):
        self.open = 0
        self.started = 0
        page.on('request', self._start)
        page.on('requestfinished', self._end)
        page.on('requestfailed', self._end)

    @staticmethod
    def _ours(r) -> bool:
        return '/foodchat/' in r.url and r.method == 'POST'

    def _start(self, r):
        if self._ours(r):
            self.open += 1
            self.started += 1

    def _end(self, r):
        if self._ours(r):
            self.open = max(self.open - 1, 0)


async def wait_ai(d: Director, mark: int, timeout: float = 300):
    """Wait until a FoodChat request started after `mark` and none is still open."""
    t0 = time.time()
    while d.busy.started == mark or d.busy.open > 0:
        if time.time() - t0 > timeout:
            raise TimeoutError('FoodChat did not answer')
        await d.wait(400)
    await d.wait(1200)   # the page renders the answer


async def wait_plan(d: Director, before: str | None = None, timeout: float = 300):
    """Wait until a plan is on screen (and differs from `before`, if given).
    Some calls return at once and FoodChat builds the plan in the background."""
    t0 = time.time()
    while True:
        if await has_plan(d.page) and (before is None or await plan_text(d.page) != before):
            break
        if await paused(d.page):
            return
        if time.time() - t0 > timeout:
            raise TimeoutError('no plan')
        await d.wait(700)
    await d.wait(1500)


async def plan_text(page) -> str:
    plan = page.locator('[data-flows="foodchat-plan"]')
    return (await plan.first.inner_text()) if await plan.count() else ''


async def paused(page) -> bool:
    """FoodChat stopped to ask a question (before there is a plan)."""
    pot = page.locator('.fc-paused-pot')
    return bool(await pot.count()) and await pot.first.is_visible()


async def has_plan(page) -> bool:
    save = page.locator('[data-flows="foodchat-save-plan"]')
    return bool(await save.count()) and await save.first.is_visible()


# ------------------------------------------------------------------ the guest's API
async def guest(page) -> dict:
    return await page.evaluate("JSON.parse(sessionStorage.getItem('wisefood_guest_session'))")


async def api(page, method: str, path: str, body=None) -> dict:
    return await page.evaluate('''async ([o, m, p, b]) => {
        const g = JSON.parse(sessionStorage.getItem('wisefood_guest_session'))
        const r = await fetch(o + '/rest/api/v1' + p, {method: m, body: b ? JSON.stringify(b) : undefined,
            headers: {Authorization: 'Bearer ' + g.accessToken, 'Content-Type': 'application/json'}})
        let j = null; try { j = await r.json() } catch (e) {}
        return {status: r.status, body: j}
    }''', [ORIGIN, method, path, body])


def result(r: dict):
    b = r.get('body')
    return b.get('result', b) if isinstance(b, dict) else b


async def session_has_plan(page, sid: str, member: str) -> bool:
    r = await api(page, 'GET', f'/foodchat/sessions/{sid}/meal-plans/current?member_id={member}')
    p = result(r) if r['status'] == 200 else None
    return bool(p and (p.get('meals') or p.get('days') or p.get('id')))


async def navigate(page, path: str):
    """Navigate inside the app (no reload), as a click would."""
    await page.evaluate("p => document.getElementById('__nuxt').__vue_app__.config.globalProperties.$router.push(p)", path)


# ------------------------------------------------------------------ fixtures
async def ensure_plan_session(page, lang: str) -> str:
    """The id of a FoodChat session of this guest that has a plan; makes one off camera."""
    g = await guest(page)
    path = os.path.join(WORK, f'fc-plan-{lang}.json')
    if os.path.exists(path):
        f = json.load(open(path))
        if f.get('memberId') == g['memberId'] and await session_has_plan(page, f['session'], g['memberId']):
            return f['session']
    # Any plan the guest already has will do (a clip may just have made one).
    for s in sorted(result(await api(page, 'GET', f"/foodchat/members/{g['memberId']}/sessions")) or [],
                    key=lambda s: s.get('created_at', ''), reverse=True):
        if await session_has_plan(page, s['session_id'], g['memberId']):
            json.dump({'memberId': g['memberId'], 'session': s['session_id']}, open(path, 'w'))
            return s['session_id']
    busy = Busy(page)
    await page.goto(f'{BASE}/foodchat', wait_until='domcontentloaded')
    await page.wait_for_selector('[data-flows="foodchat-suggestions"]', timeout=60000)
    await page.wait_for_timeout(1500)
    for attempt in range(2):
        mark = busy.started
        if attempt == 0:
            await page.locator('[data-flows="foodchat-suggestions"] button').first.click()   # "Plan my day"
        else:
            box = page.locator('[data-flows="foodchat-composer"] textarea').first
            await box.fill(L(lang, 'foodChatHome.suggestedQuestions.dailyPlan'))
            await page.keyboard.press('Enter')
        d = type('D', (), {'busy': busy, 'wait': lambda self, ms: page.wait_for_timeout(ms)})()
        await wait_ai(d, mark)
        if await paused(page):
            mark = busy.started
            box = page.locator('[data-flows="foodchat-composer"] textarea').first
            await box.fill(_ANSWERS[lang])
            await page.keyboard.press('Enter')
            await wait_ai(d, mark)
        if await has_plan(page):
            break
    else:
        raise TimeoutError('no plan for the fixture')
    sessions = result(await api(page, 'GET', f"/foodchat/members/{g['memberId']}/sessions")) or []
    for s in sorted(sessions, key=lambda s: s.get('created_at', ''), reverse=True):
        if await session_has_plan(page, s['session_id'], g['memberId']):
            json.dump({'memberId': g['memberId'], 'session': s['session_id']}, open(path, 'w'))
            return s['session_id']
    raise TimeoutError('the new plan has no session')


_ANSWERS = {
    'en': 'No other preferences, surprise me',
    'hu': 'Nincs más kérésem, lepj meg',
    'sl': 'Nimam drugih želja, preseneti me',
}


async def prepare_plan(page, t):
    """Off camera: open the guest's plan, top of the page, nothing open."""
    lang = LANG_HINT['lang']
    sid = await ensure_plan_session(page, lang)
    if '/dashboard' not in page.url:
        await page.goto(f'{BASE}/dashboard', wait_until='domcontentloaded')
        await page.wait_for_function("document.getElementById('__nuxt')?.__vue_app__", timeout=60000)
    await page.wait_for_timeout(4000)   # the member is known
    await navigate(page, f'/foodchat?session={sid}')
    await page.wait_for_selector('[data-flows="foodchat-save-plan"]', timeout=60000)
    await page.evaluate('document.fonts.ready')
    await page.wait_for_timeout(2500)
    await page.evaluate('window.scrollTo(0, 0)')


GRADES_JS = """() => [...document.querySelectorAll('[data-flows="foodchat-meal-menu"]')]
    .filter(m => m.offsetParent)
    .map(m => {
        const card = m.closest('div.p-5')
        const badge = card && [...card.querySelectorAll('[title]')].find(e => /^[A-E]$/.test(e.textContent.trim()))
        return badge ? badge.textContent.trim() : 'A'
    })"""


async def worst_meal(page) -> tuple[int, str]:
    """The meal with the worst Nutri-Score: (index among visible meal menus, grade)."""
    grades = await page.evaluate(GRADES_JS)
    if not grades:
        return 0, 'A'
    i = max(range(len(grades)), key=lambda k: grades[k])
    return i, grades[i]


# A dinner graded C (checked 2026-11-17 through recipe details): a normal meal
# with room to improve. Recipe titles are English in every language.
ADAPT_PICKS = (('bbq chicken pizza', 'BBQ Chicken Pizza'),)


async def prepare_adapt(page, t):
    """Off camera: a plan with a meal that has room to improve. FoodChat calls
    an A- or B-graded recipe "already in great shape" and offers nothing, and
    it will not put a richer meal in a plan when asked (its own matching keeps
    to healthy recipes). So compose the day: pick a rich dinner yourself, let
    FoodChat fill the rest, and check a meal grades C or worse."""
    lang = LANG_HINT['lang']
    await prepare_start(page, t)
    busy = Busy(page)
    d = type('D', (), {'busy': busy, 'page': page, 'wait': lambda self, ms: page.wait_for_timeout(ms)})()
    await page.get_by_text(L(lang, 'foodChatHome.manual.entry'), exact=True).first.click()
    await page.wait_for_timeout(1200)
    picked = False
    for term, title in ADAPT_PICKS:
        await page.get_by_role('button', name=L(lang, 'foodChatHome.manual.addRecipe')).last.click()   # dinner
        search = page.get_by_placeholder(L(lang, 'foodChatHome.manual.searchPlaceholder')).first
        await search.wait_for(timeout=20000)
        await search.fill(term)
        await page.wait_for_timeout(2500)
        option = page.get_by_text(title, exact=True).first
        if await option.count():
            await option.click()
            picked = True
            break
        await page.keyboard.press('Escape')
    if not picked:
        raise TimeoutError('no rich dinner to pick')
    await page.wait_for_timeout(1000)
    mark = busy.started
    await page.get_by_role('button', name=L(lang, 'foodChatHome.manual.fillRest')).first.click()
    await wait_ai(d, mark)
    await wait_plan(d)
    if (await worst_meal(page))[1] < 'C':
        raise TimeoutError('no meal with room to improve')
    await page.evaluate('window.scrollTo(0, 0)')
    await page.wait_for_timeout(1500)


async def settle_on_dashboard(page, timeout: float = 30):
    """The dashboard, with the guest's own profile chosen. A household with a
    second profile sends the dashboard to "Who's eating?" (/profiles) first."""
    t0 = time.time()
    while time.time() - t0 < timeout:
        await page.wait_for_timeout(1500)
        if '/profiles' in page.url:
            g = await guest(page)
            card = page.get_by_text(g.get('username') or 'Guest', exact=True)
            if not await card.count():
                card = page.get_by_text('Guest', exact=True)
            await card.first.click()
            continue
        if '/dashboard' in page.url:
            await page.wait_for_function("document.getElementById('__nuxt')?.__vue_app__", timeout=60000)
            return
    raise TimeoutError(f'not on the dashboard: {page.url}')


async def prepare_start(page, t):
    """Off camera: FoodChat's start screen in a new, empty conversation.

    A fresh load of /foodchat reopens the member's latest conversation once
    their profile is known, which can be several seconds after the page shows,
    so a start screen seen early is not to be trusted. Instead: from the
    dashboard (the member is known there), make an empty conversation and open
    it inside the app; FoodChat then mounts with it and shows its start screen.
    """
    if '/dashboard' not in page.url:
        await page.goto(f'{BASE}/dashboard', wait_until='domcontentloaded')
    await settle_on_dashboard(page)
    await page.wait_for_timeout(3000)
    g = await guest(page)
    # A guest may start 10 conversations a day: reuse an empty one (a failed
    # take leaves one behind) before starting another.
    sessions = result(await api(page, 'GET', f"/foodchat/members/{g['memberId']}/sessions")) or []
    empty = [s for s in sessions if not s.get('message_count')]
    if empty:
        sid = sorted(empty, key=lambda s: s.get('created_at', ''))[-1]['session_id']
    else:
        r = await api(page, 'POST', '/foodchat/sessions', {'member_id': g['memberId']})
        sid = (result(r) or {}).get('session_id')
        if not sid:
            raise RuntimeError(f'could not start a conversation: {r}')
    await navigate(page, f'/foodchat?session={sid}')
    await page.wait_for_selector('[data-flows="foodchat-suggestions"]', timeout=60000)
    await page.evaluate('document.fonts.ready')
    await page.wait_for_timeout(2000)


async def prepare_diners(page, t):
    """Off camera: a second profile in the guest's household, then the start screen."""
    g = await guest(page)
    members = result(await api(page, 'GET', f"/members?household_id={g['householdId']}")) or []
    if isinstance(members, dict):
        members = members.get('members') or members.get('items') or []
    if not any((m.get('name') or '') == t['diner'] for m in members):
        r = await api(page, 'POST', '/members', {'name': t['diner'], 'age_group': 'child', 'household_id': g['householdId']})
        if r['status'] >= 300:
            raise RuntimeError(f'could not add {t["diner"]}: {r}')
        # A fresh dashboard, so the household list the page keeps includes them.
        await page.goto(f'{BASE}/dashboard', wait_until='domcontentloaded')
    await prepare_start(page, t)


async def shown_dialog(page, timeout: float = 30):
    """The dialog the viewer sees. The kitchen picker also mounts a phone
    drawer, a second dialog parked at the bottom edge; take the one that lies
    fully on screen with the largest area."""
    vp = page.viewport_size or {'width': 1440, 'height': 810}
    t0 = time.time()
    while time.time() - t0 < timeout:
        best, area = None, 0
        dialogs = page.get_by_role('dialog')
        for i in range(await dialogs.count()):
            box = await dialogs.nth(i).bounding_box()
            if not box or box['y'] < -1 or box['y'] + box['height'] > vp['height'] + 1:
                continue
            if box['width'] * box['height'] > area:
                best, area = dialogs.nth(i), box['width'] * box['height']
        if best is not None:
            return best
        await page.wait_for_timeout(300)
    raise TimeoutError('no dialog on screen')


# ------------------------------------------------------------------ pieces
COMPOSER = '[data-flows="foodchat-composer"] textarea'


async def send(d: Director, text: str | None = None):
    """Type (optionally) and send; return the request mark to wait on."""
    page = d.page
    if text is not None:
        await d.type(page.locator(COMPOSER).first, text, delay=45)
    mark = d.busy.started
    await d.click(page.locator('[data-flows="foodchat-send"]:visible').first)
    return mark


async def think(d: Director, t: dict, mark: int, caption=None) -> bool:
    """The AI at work, fast-forwarded; answers on camera if FoodChat asks a
    question first. Returns whether it asked."""
    await d.fast(True, t['fast'])
    await wait_ai(d, mark)
    await d.fast(False)
    if not (await paused(d.page) and 'ask' in t):
        return False
    await d.caption(caption or '', t['ask'], hold=600)
    mark = await send(d, t['answer'])
    await d.fast(True, t['fast'])
    await wait_ai(d, mark)
    await d.fast(False)
    return True


async def point_plan(d: Director):
    """Point at the first meal: its photo, else its menu."""
    for sel in ('[data-flows="foodchat-plan"] img', '[data-flows="foodchat-meal-menu"]'):
        loc = d.page.locator(sel)
        for i in range(min(await loc.count(), 6)):
            if await loc.nth(i).is_visible():
                await d.point(loc.nth(i))
                return


async def built_around(d: Director, lang: str):
    label = d.page.get_by_text(L(lang, 'foodChatHome.builtAround.label'), exact=True).first
    await scroll_to(d, label, offset=220)
    await d.point(label)


# ------------------------------------------------------------------ the clips
async def clip_generate_plan(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    await d.title('FoodChat', t['title'])
    await d.caption(1, t['c1'], hold=500)
    mark = await send(d, t['q'])
    await d.caption(2, t['c2'], hold=300)
    asked = await think(d, t, mark, caption=3)
    if not await has_plan(page):
        raise TimeoutError('no plan')
    n = 4 if asked else 3
    await d.caption(n, t['c3'], hold=300)
    await point_plan(d)
    d.rec.mark('poster')
    await d.wait(2600)
    await d.caption(n + 1, t['c4'], hold=300)
    await built_around(d, lang)
    await d.wait(2600)


async def clip_refine(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    await d.title('FoodChat', t['title'])
    await d.caption(1, t['c1'], hold=500)
    mark = await send(d, t['q'])
    await think(d, t, mark)
    await d.caption(2, t['c2'], hold=300)
    await d.point(page.locator('[data-flows="foodchat-plan"]').first)
    d.rec.mark('poster')
    await d.wait(2400)
    await d.caption(3, cap(t, 'c3', lang), hold=300)
    swap = page.locator('[data-flows="foodchat-meal-replace"]').first
    await scroll_to(d, swap, offset=300)
    await d.click(swap)
    await d.wait(900)
    await d.caption(4, t['c4'], hold=900)
    # Swap's own suggestion ("Swap the breakfast for something lighter") made
    # FoodChat ask which meal should move; the clip shows editing it instead.
    box = page.locator(COMPOSER).first
    await d.click(box)
    await page.keyboard.press('Control+A')
    await page.keyboard.type(t['edit'], delay=45)
    await d.wait(500)
    before = await plan_text(page)
    mark = await send(d)
    await d.fast(True, t['fast'])
    await wait_ai(d, mark)
    await d.fast(False)
    if await plan_text(page) == before:   # asked a question instead: another take
        raise TimeoutError('the plan did not change')
    await point_plan(d)
    await d.wait(2400)


async def clip_tools(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    lab = LABELS(lang)
    await d.title('FoodChat', t['title'])
    await d.caption(1, cap(t, 'c1', lang), hold=500)
    await d.click(page.locator('[data-flows="foodchat-tool-shopping_list"]').first)
    card = page.locator('[data-flows="foodchat-tool-result"]').first
    await card.wait_for(timeout=60000)
    await d.wait(800)
    await d.point(card.locator('li, tr, dd, span').nth(3))
    d.rec.mark('poster')
    await d.wait(2400)
    await d.caption(2, cap(t, 'c2', lang), hold=300)
    mark = d.busy.started
    await d.click(page.get_by_role('button', name=lab['more']).first)
    await d.wait(600)
    await d.click(page.get_by_role('menuitem', name=lab['totals']).first)
    if d.busy.started != mark:
        await d.fast(True, t['fast'])
        await wait_ai(d, mark, timeout=120)
        await d.fast(False)
    await d.wait(2400)
    await d.caption(3, t['c3'], hold=300)
    close = page.locator('[data-flows="foodchat-tool-result"] button:has(.i-lucide-x), [data-flows="foodchat-tool-result"] button[aria-label]').first
    await d.click(close)
    await d.wait(1500)


async def clip_save_share(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    lab = LABELS(lang)
    await d.title('FoodChat', t['title'])
    save = page.locator('[data-flows="foodchat-save-plan"]').first
    if (await save.inner_text()).strip() != lab['save']:   # saved by an earlier take
        await save.click()
        await d.wait(1200)
    await d.caption(1, t['c1'], hold=500)
    await d.click(save)
    await d.wait(1800)
    await d.caption(2, t['c2'], hold=300)
    await d.click(page.locator('[data-flows="foodchat-share-plan"]').first)
    dialog = await shown_dialog(page)
    await d.wait(1500)
    d.rec.mark('poster')
    await d.caption(3, t['c3'], hold=300)
    await d.click(dialog.get_by_role('button', name=lab['copy']).first)
    await d.wait(1200)
    await d.point(dialog.locator('input[type="email"]').first)
    await d.wait(900)
    await d.caption(4, t['c4'], hold=300)
    await d.point(dialog.get_by_role('button', name=lab['revoke']).first)
    await d.wait(1600)
    await d.click(dialog.get_by_role('button', name=lab['done']).first)
    await d.wait(1200)


async def clip_pantry(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    lab = LABELS(lang)
    await d.title('FoodChat', t['title'])
    await d.caption(1, t['c1'], hold=500)
    await d.click(page.locator('[data-flows="foodchat-start-kitchen"]').get_by_role('button').first)
    await d.wait(700)
    picker = await shown_dialog(page)
    chips = picker.locator('button[aria-pressed]')
    if not await chips.count():
        chips = picker.locator('section button, li button')
    # tomatoes, spinach, eggs, feta: the same places in every language's list.
    # The kitchen is kept per member, so a re-take may find them ticked already.
    for i in (0, 9, 17, 25):
        if await chips.nth(i).get_attribute('aria-pressed') != 'true':
            await d.click(chips.nth(i), pause=250)
    await d.wait(500)
    await d.caption(2, t['c2'], hold=300)
    # "Use these" keeps the ingredients and closes the picker; the kitchen card
    # ("Cook from what's in my kitchen") opens it again to plan, where the
    # button reads "Plan from these". With them kept already, it reads that now.
    cook_label = L(lang, 'foodChatHome.pantryPicker.cook')
    main = picker.locator('button:visible').last
    if (await main.inner_text()).strip() != cook_label:
        await d.click(main)
        await d.wait(1000)
        await d.click(page.locator('[data-flows="foodchat-suggestion-kitchen"]').first)
        await d.wait(1000)
    cook = page.locator('button:visible', has_text=cook_label)
    for _ in range(25):
        if await cook.count():
            break
        await d.wait(200)
    mark = d.busy.started
    await d.click(cook.last)
    await think(d, t, mark)
    await d.fast(True, t['fast'])
    await wait_plan(d)
    await d.fast(False)
    if not await has_plan(page):
        raise TimeoutError('no plan')
    await d.caption(3, t['c3'], hold=300)
    await built_around(d, lang)
    d.rec.mark('poster')
    await d.wait(2800)


async def clip_settings(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    lab = LABELS(lang)
    await d.title('FoodChat', t['title'])
    await d.caption(1, cap(t, 'c1', lang), hold=500)
    await d.click(page.locator('[data-flows="foodchat-plan-settings"]').first)
    panel = page.locator('[data-flows="foodchat-plan-settings-panel"]').first
    await panel.wait_for(timeout=30000)
    await d.wait(900)
    await d.caption(2, t['c2'], hold=300)
    await d.click(panel.get_by_role('button', name='30', exact=True).first)
    await d.click(panel.get_by_role('button', name=lab['protein']).first)
    d.rec.mark('poster')
    await d.wait(900)
    await d.caption(3, cap(t, 'c3', lang), hold=400)
    mark = d.busy.started
    await d.click(page.locator('[data-flows="foodchat-adjust-apply"]').first)
    await d.fast(True, t['fast'])
    await wait_ai(d, mark)
    await d.fast(False)
    await d.caption(4, t['c4'], hold=300)
    await built_around(d, lang)
    await d.wait(2800)


async def clip_diners(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    await d.title('FoodChat', t['title'])
    await d.caption(1, t['c1'], hold=500)
    diner = page.get_by_role('button', name=t['diner']).first
    await d.click(diner)
    await d.wait(900)
    await d.caption(2, t['c2'], hold=300)
    # A specific request: "Plan my day" alone makes FoodChat ask about cravings.
    mark = await send(d, t['q'])
    await think(d, t, mark)
    if not await has_plan(page):
        raise TimeoutError('no plan')
    await d.caption(3, t['c3'], hold=300)
    await built_around(d, lang)
    d.rec.mark('poster')
    await d.wait(2800)


async def clip_compose(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    lab = LABELS(lang)
    await d.title('FoodChat', t['title'])
    await d.caption(1, t['c1'], hold=500)
    await d.click(page.get_by_text(lab['entry'], exact=True).first)
    await d.wait(1200)
    await d.caption(2, t['c2'], hold=300)
    await d.click(page.get_by_role('button', name=lab['add_recipe']).first)
    search = page.get_by_placeholder(L(lang, 'foodChatHome.manual.searchPlaceholder')).first
    await search.wait_for(timeout=20000)
    await d.type(search, t['search'], delay=90)
    await d.wait(2200)
    option = page.get_by_role('option').first
    if not await option.count():
        option = search.locator('xpath=following::button[1]')
    await d.click(option)
    await d.wait(1200)
    d.rec.mark('poster')
    await d.caption(3, t['c3'], hold=300)
    mark = d.busy.started
    await d.click(page.get_by_role('button', name=lab['fill']).first)
    await d.fast(True, t['fast'])
    await wait_ai(d, mark)
    await wait_plan(d)   # /compose returns at once; the plan follows
    await d.fast(False)
    if not await has_plan(page):
        raise TimeoutError('no plan')
    await point_plan(d)
    await d.wait(2600)


async def clip_adapt(d: Director, t, lang, phone):
    page = d.page
    d.busy = Busy(page)
    lab = LABELS(lang)
    await d.title('FoodChat', t['title'])
    await d.caption(1, cap(t, 'c1', lang), hold=500)
    i, _ = await worst_meal(page)
    menu = page.locator('[data-flows="foodchat-meal-menu"]:visible').nth(i)
    await scroll_to(d, menu, offset=300)
    await d.click(menu)
    await d.wait(600)
    await d.click(page.get_by_role('menuitem', name=lab['adapt']).first)
    await d.caption(2, t['c2'], hold=300)
    save = page.locator('[data-flows="foodchat-adapt-save"]').first
    optimal = page.get_by_text(L(lang, 'foodChatHome.adaptModal.alreadyOptimal'))
    await d.fast(True, t['fast'])
    t0 = time.time()
    while not (await save.count() and await save.is_visible()):
        if await optimal.count() or time.time() - t0 > 180:   # nothing to adapt: another take
            raise TimeoutError('no adapted version')
        await d.wait(500)
    await d.fast(False)
    await d.wait(1600)
    d.rec.mark('poster')
    await d.caption(3, t['c3'], hold=300)
    await d.click(save)
    saved = page.get_by_text(L(lang, 'foodChatHome.adaptModal.saved'), exact=True)
    try:
        await saved.first.wait_for(timeout=20000)
    except Exception:
        pass
    await d.wait(2200)


PLAN = {'path': '/dashboard', 'ready': '[data-flows="help-button"]', 'prepare': prepare_plan}
START = {'path': '/dashboard', 'ready': '[data-flows="help-button"]', 'prepare': prepare_start}

CLIPS.update({
    'foodchat-generate-plan': dict(START, run=clip_generate_plan),
    'foodchat-compose': dict(START, run=clip_compose),
    'foodchat-pantry': dict(START, run=clip_pantry),
    'foodchat-diners': dict(START, prepare=prepare_diners, run=clip_diners),
    'foodchat-tools': dict(PLAN, run=clip_tools),
    'foodchat-save-share': dict(PLAN, run=clip_save_share),
    'foodchat-adapt': dict(PLAN, prepare=prepare_adapt, run=clip_adapt),
    'foodchat-refine': dict(PLAN, run=clip_refine),
    'foodchat-settings': dict(PLAN, run=clip_settings),
})
