"""Runs every problem through Coaching and Testing in a browser. Run: python3 test/browser_test.py"""
import sys, pathlib
from playwright.sync_api import sync_playwright
url = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
errors, fails = [], 0
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 1000})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.goto(url); pg.wait_for_selector('#cPick option', state='attached')
    ids = pg.eval_on_selector_all('#cPick option', 'os => os.map(o => o.value)')
    for i, pid in enumerate(ids):
        pg.select_option('#cPick', pid)
        s = pg.evaluate('''id => { const s = BEE.solve(BEW_PROBLEMS.find(x => x.id === id));
          return {grid: s.species.map(f => s.types.map(t => s.lib[f].bonds[t] || 0)), steps: s.steps.map(x => x.ans)}; }''', pid)
        if i == 0:
            pg.click('#kCheck'); assert pg.locator('#kFb.bad').count() == 1
        for r, row in enumerate(s['grid']):
            for c, n in enumerate(row):
                pg.fill(f'[data-c="{r}_{c}"]', str(n) if n else '')
        pg.click('#kCheck')
        if pg.locator('#kFb.ok').count() != 1: print('✗', pid, 'counts'); fails += 1; continue
        for j, a in enumerate(s['steps']):
            if i == 0 and j == 2:
                pg.fill('#calcIn', repr(-a)); pg.click('#calcCk'); print('  wrong-sign msg:', pg.inner_text('#calcFb')[:90])
            pg.fill('#calcIn', repr(a)); pg.click('#calcCk')
        if pg.locator('.summary').count() != 1: print('✗', pid, 'calc'); fails += 1; continue
        print('✓', pid)
        if pid in ('B3-01',): pg.screenshot(path='/tmp/be_coach.png', full_page=True)
    pg.click('nav button[data-tab=test]')
    tid = pg.evaluate("() => document.querySelector('#tBody .pid').textContent.split(' ')[0]")
    a = pg.evaluate('id => BEE.solve(BEW_PROBLEMS.find(x => x.id === id)).est', tid)
    pg.fill('#tAns', repr(-a)); pg.click('#tCheck'); print('Testing wrong:', pg.inner_text('#tFb'))
    pg.fill('#tAns', repr(a)); pg.click('#tCheck'); print('Testing right:', pg.inner_text('#tFb'))
    pg.screenshot(path='/tmp/be_test.png', full_page=True)
    pg.click('nav button[data-tab=review]'); pg.screenshot(path='/tmp/be_review.png', full_page=True)
    pg.click('nav button[data-tab=instr]')
    csv = b'kind,id,level,reaction,text,formula,name,bonds,dHf,struct\nmolecule,,,,,C2H4Cl2,"1,2-dichloroethane (gas)",C-C:1; C-H:4; C-Cl:2,-129.8,\nproblem,X-01,2,C2H4 + Cl2 -> C2H4Cl2,,,,,,\nproblem,X-02,2,C2H4 + Br2 -> C2H4Br2,,,,,,\nmolecule,,,,,XY,bad,Q-Q:1,abc,\n'
    pg.set_input_files('#iFile', files=[{'name': 't.csv', 'mimeType': 'text/csv', 'buffer': csv}])
    pg.wait_for_selector('#iRes table'); print('Upload:', pg.inner_text('#iRes')[:600])
    b.close()
print('errors:', errors); print('fails:', fails); sys.exit(1 if fails or errors else 0)
