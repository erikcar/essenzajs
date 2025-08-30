import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
// Aggiungi il polyfill se ResizeObserver non è disponibile
//import ResizeObserver from "resize-observer-polyfill";

export function VirtualizedList({
  items,
  overscan = 5,
  ui,
  className = "",
}) {
  const itemHeight = ui.props.itemHeight || 50; // Altezza fissa per ogni elemento
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  // ResizeObserver (polyfilled per compatibilità)
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

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - overscan
  );
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const slice = [];
    for (let i = startIndex; i <= endIndex; i++) slice.push([items[i], i]);
    return slice;
  }, [items, startIndex, endIndex]);

  // Throttling del scroll con requestAnimationFrame
  const rAF = useRef(0);
  const onScroll = useCallback((e) => {
    if (rAF.current) cancelAnimationFrame(rAF.current);
    rAF.current = requestAnimationFrame(() => {
      setScrollTop(e.target.scrollTop);
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(rAF.current), []);

  const paddingTop = startIndex * itemHeight;
  const paddingBottom = totalHeight - (endIndex + 1) * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={className}
      role="list"
      aria-label="Virtualized list"
    //style={{ height: "100%" }}
    // Si consiglia di non aggiungere listener touch, ma se serve:
    // aggiungere { passive: true } manualmente se necessario
    >
      <div style={{ paddingTop, paddingBottom }}>
        {visibleItems.map(([item, i]) => ui.renderItem(item, i))}
      </div>
    </div>
  );
}



/**
 * 
 */
function virtualizer(items, itemHeight, overscan) {
  this.scrollTop = 0;
  this.overscan = 5;
  this.totalHeight = items.length * itemHeight;
  this.startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  this.endIndex = Math.min(
    items.length - 1,
    Math.floor((this.scrollTop + height) / itemHeight) + overscan
  );
}
