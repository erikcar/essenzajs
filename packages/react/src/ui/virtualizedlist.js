import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";

/**
 * VirtualizedList — dependency‑free windowed list with support for variable row heights.
 *
 * Props:
 *  - items: any[]                      // your data array
 *  - estimatedItemHeight: number       // used as fallback before measuring
 *  - height?: number                   // viewport height in px (default: 400)
 *  - overscan?: number                 // extra rows to render above/below (default: 5)
 *  - renderItem: (item, index) => JSX  // how to render each row
 *  - className?: string                // optional container classes
 */
export function VirtualizedList({
  items,
  estimatedItemHeight = 40,
  height = 400,
  overscan = 5,
  renderItem,
  className = "",
}) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [heights, setHeights] = useState(new Map()); // index -> measured height

  // refs for row elements currently rendered
  const rowRefs = useRef(new Map());

  // recompute total height and prefix sums
  const { totalHeight, positions } = useMemo(() => {
    let total = 0;
    const pos = [];
    for (let i = 0; i < items.length; i++) {
      pos[i] = total;
      total += heights.get(i) ?? estimatedItemHeight;
    }
    return { totalHeight: total, positions: pos };
  }, [items.length, heights, estimatedItemHeight]);

  // measure heights when rendered
  useEffect(() => {
    rowRefs.current.forEach((el, i) => {
      if (el) {
        const h = el.offsetHeight;
        if (h && heights.get(i) !== h) {
          setHeights((prev) => new Map(prev).set(i, h));
        }
      }
    });
  });

  // binary search to find start index based on scrollTop
  const findStartIndex = () => {
    let low = 0;
    let high = items.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (positions[mid] + (heights.get(mid) ?? estimatedItemHeight) < scrollTop) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return Math.max(0, low);
  };

  const startIndex = findStartIndex();
  let endIndex = startIndex;
  let viewportHeight = 0;
  while (endIndex < items.length && viewportHeight < height) {
    viewportHeight += heights.get(endIndex) ?? estimatedItemHeight;
    endIndex++;
  }
  endIndex = Math.min(items.length - 1, endIndex + overscan);
  const firstIndex = Math.max(0, startIndex - overscan);

  const visibleItems = useMemo(() => {
    const slice = [];
    for (let i = firstIndex; i <= endIndex; i++) slice.push([items[i], i]);
    return slice;
  }, [items, firstIndex, endIndex]);

  // Throttle scroll updates with rAF for smooth scrolling
  const rAF = useRef(0);
  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    if (rAF.current) cancelAnimationFrame(rAF.current);
    rAF.current = requestAnimationFrame(() => {
      setScrollTop(containerRef.current.scrollTop);
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(rAF.current), []);

  const paddingTop = positions[firstIndex] ?? 0;
  const paddingBottom = totalHeight - (positions[endIndex + 1] ?? totalHeight);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{ height }}
      className={
        "relative w-full overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm " +
        className
      }
      role="list"
      aria-label="Virtualized list"
    >
      <div style={{ paddingTop, paddingBottom }}>
        {visibleItems.map(([item, i]) => (
          <div
            key={i}
            ref={(el) => rowRefs.current.set(i, el)}
            role="listitem"
            className="flex items-center px-4"
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>
      <span className="sr-only">{items.length} elementi totali</span>
    </div>
  );
}

// ---- Demo component (default export) ----
export default function DemoVirtualizedList() {
  const items = useMemo(
    () =>
      Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        title: `Elemento #${i + 1}`,
        subtitle: i % 2 === 0 ? "Riga corta" : "Riga con un contenuto molto più lungo che aumenta l'altezza dell'elemento",
      })),
    []
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">VirtualizedList (altezze variabili)</h1>
          <p className="text-sm text-gray-600">
            Supporta elementi con altezze variabili, misurate automaticamente.
          </p>
        </header>

        <VirtualizedList
          items={items}
          estimatedItemHeight={48}
          height={420}
          overscan={6}
          renderItem={(item, i) => (
            <div className="flex w-full flex-col">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.subtitle}</div>
              {i % 10 === 0 && (
                <div className="mt-1 rounded bg-blue-100 p-2 text-xs text-blue-800">
                  Extra contenuto casuale per aumentare l'altezza di questa riga.
                </div>
              )}
            </div>
          )}
        />

        <footer className="mt-6 text-xs text-gray-500">
          Suggerimento: per ottimizzare ulteriormente, puoi usare un ResizeObserver su ogni riga
          per rilevare cambiamenti dinamici dell'altezza.
        </footer>
      </div>
    </div>
  );
}
