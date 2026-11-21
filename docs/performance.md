# Performance

## How it was measured

- **Script:** `scripts/measure-performance.py` (Playwright + Chrome).
- **CPU throttled 4×** to mimic a mid-range laptop. Absolute numbers are higher than on a fast machine; the _before → after_ comparison is what matters.
- **What was measured:**
  - **Load and scroll:** measured on the **production build** (`npm run build && vite preview`). Clicking "Show all results" until the grid is painted gives the render time; the browser's `longtask` observer gives the long tasks and blocking time (the sum of each long task's time over 50 ms); and we count DOM nodes.
  - **Scroll smoothness:** 150 animation frames scrolling 60 px each, timing every frame (60 fps = 16.7 ms per frame; above 50 ms is visibly janky).
  - **Re-render cost:** measured on the **dev build** with React's `<Profiler>` around the grid (`src/monitoring/perf.ts`). It records `actualDuration` for each re-render caused by a live stock push (D4-4).

## The two slowest spots

Measuring first showed two clear problems:

1. **"Show all results" renders all 5,000 cards at once.** That's 45,000 DOM nodes and a 2.6-second frozen main thread, and scrolling ran at about 6 fps.
2. **Every live stock push re-rendered every card,** even though only one card's stock changed: 63 ms with 24 cards, and **almost 2 seconds** with 5,000.

## Fix 1: Virtualization (D4-3)

`VirtualProductGrid` uses `@tanstack/react-virtual` with the window as the scroller. The container keeps the full height of all rows (`rows × 306 px`), but only the rows in view, plus 3 rows of "overscan" above and below, exist in the DOM. Columns are computed from the container width (a `ResizeObserver`), and card height is fixed by CSS so every row is exactly the same height.

| Show all 5,000 products       | Before            | After                 | Change    |
| ----------------------------- | ----------------- | --------------------- | --------- |
| Click → grid painted          | 5,620 ms          | **803 ms**            | 7× faster |
| Longest main-thread task      | 2,633 ms          | **69 ms**             |           |
| Total blocking time           | 5,221 ms          | **19 ms**             |           |
| DOM nodes on page             | 45,088            | **318**               | 99% fewer |
| Product cards in DOM          | 5,000             | **~25–30**            |           |
| JS heap                       | 68.0 MB           | **13.4 MB**           |           |
| Scroll: average frame         | 160.8 ms (~6 fps) | **21.0 ms (~48 fps)** | smooth    |
| Scroll: janky frames (>50 ms) | 105 of 149        | **1 of 149**          |           |

**Trade-offs:**

- **Keyboard:** Tab can only reach rendered cards, so a keyboard user tabbing past the overscan rows leaves the grid. The default **24 per page** view (no virtualization) stays fully keyboard-friendly, and "Show all" is opt-in.
- **Ctrl+F:** browser find can't see cards that aren't rendered. The search box covers that need.
- **Screen readers:** `aria-setsize` and `aria-posinset` tell them each card's position in the full list (e.g. "item 1,203 of 5,000").

## Fix 2: `React.memo` on `ProductCard` (D4-3)

When a live update arrives, the grid re-renders. With `memo`, each card compares its props (`product`, `stock`) to the previous ones and skips rendering if they're the same. `product` keeps the same object reference (it comes from the cached response), and `stock` is a number, so only the one changed card re-renders.

| Re-render per live stock update (React Profiler, dev build) | Before     | After                   |
| ----------------------------------------------------------- | ---------- | ----------------------- |
| Paged view (24 cards); memo is the only change here         | 63.2 ms    | **15.2 ms** (4× less)   |
| Show-all view (5,000 cards → virtualized + memo)            | 1,946.8 ms | **17.5 ms** (110× less) |

## Optimizations removed or skipped (and why)

- **Removed: `useMemo` around `parseFilters()` in `useProductFilters`.** Parsing five URL parameters takes microseconds, and nothing depends on the object's identity (the request key is a string). The memo added code and a dependency array to maintain, for no measurable gain.
- **Skipped: `useCallback` for the filter handlers.** They're passed to `FiltersBar`, which isn't memoized and re-renders cheaply. `useCallback` only helps when the receiving component is memoized (or the function is an effect dependency). Here it would be pure overhead.
- **Skipped: memoizing `formatPrice`.** The expensive part, creating the `Intl.NumberFormat`, already happens once at module load (D2-1). Each `format()` call is fast.
- **Skipped: virtualizing the 24-per-page grid.** 24 cards render in a few milliseconds. Virtualization would add complexity and the keyboard and find-in-page trade-offs above, for no benefit.

**Rule of thumb we followed:** measure, fix the biggest number, measure again. Don't memoize by default.
