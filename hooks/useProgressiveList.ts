import { useState, useEffect, useRef } from 'react';

interface ProgressiveListOptions {
  initial?: number;
  batch?: number;
  delay?: number;
  rootMargin?: string;
  root?: React.RefObject<any> | (() => Element | null) | null;
  resetKey?: unknown;
}

export function useProgressiveList<T>(
  items: T[],
  {
    initial = 15,
    batch = 15,
    delay = 200,
    rootMargin = '200px',
    root,
    resetKey,
  }: ProgressiveListOptions
) {
  const [visibleCount, setVisibleCount] = useState(initial);
  const [isRevealing, setIsRevealing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = () => {
    setVisibleCount(initial);
    setIsRevealing(false);
    loadingRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const prevResetKeyRef = useRef(resetKey);
  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      reset();
      prevResetKeyRef.current = resetKey;
    }
  }, [resetKey, initial]);

  const hasMore = visibleCount < items.length;
  const itemsLengthRef = useRef(items.length);
  itemsLengthRef.current = items.length;

  useEffect(() => {
    if (!hasMore) return;

    let rootElement: Element | null = null;
    if (typeof root === 'function') {
      rootElement = root();
    } else if (root && 'current' in root) {
      rootElement = root.current;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loadingRef.current && visibleCount < itemsLengthRef.current) {
          loadingRef.current = true;
          setIsRevealing(true);

          timeoutRef.current = setTimeout(() => {
            setVisibleCount((prev) => prev + batch);
            loadingRef.current = false;
            setIsRevealing(false);
          }, delay);
        }
      },
      {
        root: rootElement,
        rootMargin,
        threshold: 0,
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasMore, visibleCount, batch, delay, rootMargin, root]);

  const clampedCount = Math.min(visibleCount, items.length);
  const visible = items.slice(0, clampedCount);

  return {
    visible,
    visibleCount: clampedCount,
    hasMore,
    isRevealing,
    sentinelRef,
    reset
  };
}
