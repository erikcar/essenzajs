/** @fileoverview packages/react/src\ui\virtualized.js */
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
// import ResizeObserver from "resize-observer-polyfill"; // opzionale per retrocompatibilità

/**
 * VirtualizedList function.
 * @param {any} param1
 * @returns {any}
 */
export function VirtualizedList({
  items,
  overscan = 5,
  ui,
  className = "",
  onLoadMore,     // callback per caricare nuovi record
  hasMore = false, // se false, disattiva il sentinella
  loader = null,  // componente opzionale da mostrare durante il caricamento
}) {
  const itemHeight = ui.props.itemHeight || 50;
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const rAF = useRef(0);

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const [isLoading, setIsLoading] = useState(false);

  // --- ResizeObserver per aggiornare l’altezza del contenitore ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Calcolo range visibile ---
  const totalHeight = useMemo(
    () => items.length * itemHeight,
    [items.length, itemHeight]
  );

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const slice = [];
    for (let i = startIndex; i <= endIndex; i++) {
      slice.push([items[i], i]);
    }
    return slice;
  }, [items, startIndex, endIndex]);

  // --- Scroll con requestAnimationFrame ---
  const onScroll = useCallback((e) => {
    if (rAF.current) cancelAnimationFrame(rAF.current);
    rAF.current = requestAnimationFrame(() => {
      setScrollTop(e.target.scrollTop);
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(rAF.current), []);

  // --- IntersectionObserver per il sentinella ---
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading) {
          // controllo extra per evitare trigger anticipati
          const container = containerRef.current;
          if (!container) return;
          const { scrollTop, scrollHeight, clientHeight } = container;
          const nearBottom = scrollHeight - scrollTop - clientHeight < 200;
          if (nearBottom) {
            setIsLoading(true);
            try {
              await onLoadMore();
            } finally {
              setIsLoading(false);
            }
          }
        }
      },
      {
        root: containerRef.current,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, isLoading, hasMore]);

  // --- Rendering ---
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={className}
      role="list"
      aria-label="Virtualized list"
      style={{ overflowY: "auto", height: "100%", position: "relative" }}
    >
      {/* Contenitore totale, con altezza virtuale */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Wrapper degli elementi visibili */}
        <div
          style={{
            position: "absolute",
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(([item, i]) => (
            <div key={item.id || i} role="listitem">
              {ui.renderItem(item, i)}
            </div>
          ))}
        </div>

        {/* Sentinella in fondo alla lista logica */}
        <div
          ref={sentinelRef}
          style={{
            position: "absolute",
            top: totalHeight - 1,
            height: 1,
            width: "100%",
            pointerEvents: "none",
            opacity: 0, // invisibile, ma mantiene il layout stabile
          }}
        />
      </div>

      {/* Loader opzionale */}
      {isLoading && loader && (
        <div role="status" aria-live="polite">
          {loader}
        </div>
      )}
    </div>
  );
}



