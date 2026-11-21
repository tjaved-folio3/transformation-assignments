"""
Measures the product list for docs/performance.md (D4-2).

Requirements: Python 3 + Playwright (pip install playwright && playwright install chromium).
Run the dev server (npm run dev, port 5173) AND a production preview
(npm run build && npx vite preview --port 4174), then: python scripts/measure-performance.py after

CPU is throttled 4x (Chrome DevTools Protocol) to mimic a mid-range laptop.
"""
import json, sys
from playwright.sync_api import sync_playwright
PROD='http://localhost:4174'; DEV='http://localhost:5173'
LT = """window.__lt=[]; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lt.push(e.duration)}).observe({type:'longtask', buffered:true});"""
def page(b):
    pg=b.new_page(viewport={'width':1280,'height':900})
    cdp=pg.context.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate', {'rate':4})
    return pg
out={}
with sync_playwright() as p:
    b=p.chromium.launch()
    # 1) Show all 5,000 (production build)
    pg=page(b); pg.goto(PROD+'/'); pg.wait_for_selector('.product-card__link'); pg.evaluate("localStorage.clear()")
    pg.evaluate(LT); pg.wait_for_timeout(500); pg.evaluate("window.__lt=[]")
    t0=pg.evaluate("performance.now()")
    pg.get_by_role('link', name='Show all results').click()
    pg.wait_for_function("document.querySelector('.result-count')?.textContent.includes('5,000') && document.querySelectorAll('.product-card__link').length > 24", timeout=60000)
    pg.wait_for_function("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))")
    t1=pg.evaluate("performance.now()")
    pg.wait_for_timeout(1500)
    lt=pg.evaluate("window.__lt")
    out['showAll_ms']=round(t1-t0); out['showAll_longTasks']=len(lt); out['showAll_blocking_ms']=round(sum(max(0,x-50) for x in lt)); out['showAll_longest_ms']=round(max(lt) if lt else 0)
    out['dom_nodes']=pg.evaluate("document.querySelectorAll('*').length"); out['cards_in_dom']=pg.evaluate("document.querySelectorAll('.product-card__link').length")
    out['heap_mb']=round(pg.evaluate("performance.memory.usedJSHeapSize")/1e6,1)
    # 2) Scroll smoothness: 150 animation frames scrolling 60px each
    frames=pg.evaluate("""new Promise(res => { const d=[]; let last=performance.now(), n=0;
      function step(t){ d.push(t-last); last=t; window.scrollBy(0,60); if(++n<150) requestAnimationFrame(step); else res(d); }
      requestAnimationFrame(step); })""")
    frames=frames[1:]
    out['scroll_avg_frame_ms']=round(sum(frames)/len(frames),1); out['scroll_janky_frames(>50ms)']=sum(1 for f in frames if f>50); out['scroll_worst_frame_ms']=round(max(frames))
    pg.close()
    # 3) Live update re-render cost (dev build, React Profiler), paged view and all view
    for view in ['', '?view=all']:
        pg=page(b); pg.goto(DEV+'/'+view); pg.wait_for_selector('.product-card__link', timeout=60000); pg.wait_for_selector('.live-status--live')
        pg.wait_for_timeout(1000); pg.evaluate("window.__bugBazaarPerf=[]")
        pg.wait_for_timeout(9000)
        commits=pg.evaluate("window.__bugBazaarPerf.filter(c=>c.phase==='update').map(c=>c.actualMs)")
        key='live_update_'+('all' if view else 'paged')
        out[key+'_commits']=len(commits); out[key+'_avg_ms']=round(sum(commits)/len(commits),2) if commits else None
        pg.close()
    b.close()
label=sys.argv[1] if len(sys.argv)>1 else 'run'
print(label, json.dumps(out, indent=1))
json.dump(out, open(f'perf-{label}.json','w'))
