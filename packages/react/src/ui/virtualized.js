import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
// import ResizeObserver from "resize-observer-polyfill"; // per retrocompatibilità se serve

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

  // --- ResizeObserver per aggiornare l’altezza dinamicamente ---
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
    for (let i = startIndex; i <= endIndex; i++) slice.push([items[i], i]);
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

  // --- Padding virtuale ---
  const paddingTop = startIndex * itemHeight;
  const paddingBottom = totalHeight - (endIndex + 1) * itemHeight;

  // --- Sentinella per caricare altri elementi ---
  useEffect(() => {
    if (!onLoadMore || !hasMore) return; // se non serve, non osserva

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading) {
          setIsLoading(true);
          try {
            await onLoadMore(); // gestito dal componente padre
          } finally {
            setIsLoading(false);
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

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={className}
      role="list"
      aria-label="Virtualized list"
      style={{ overflowY: "auto", height: "100%" }}
    >
      <div style={{ paddingTop, paddingBottom }}>
        {visibleItems.map(([item, i]) => (
          <div key={item.id || i} role="listitem">
            {ui.renderItem(item, i)}
          </div>
        ))}

        {/* Sentinella: solo se hasMore === true */}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

        {/* Loader opzionale */}
        {isLoading && loader && (
          <div role="status" aria-live="polite">
            {loader}
          </div>
        )}
      </div>
    </div>
  );
}





