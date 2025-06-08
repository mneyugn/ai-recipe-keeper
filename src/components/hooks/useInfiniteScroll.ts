import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  loadMore,
  hasMore,
  isLoading,
  threshold = 1.0,
  rootMargin = "100px",
}: UseInfiniteScrollOptions) => {
  const sentryRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      // Ładuj więcej gdy sentry element jest widoczny
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [loadMore, hasMore, isLoading]
  );

  useEffect(() => {
    const currentSentryRef = sentryRef.current;

    if (!currentSentryRef) return;

    // Tworzenie Intersection Observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    // Rozpoczęcie obserwacji
    observerRef.current.observe(currentSentryRef);

    // Cleanup
    return () => {
      if (observerRef.current && currentSentryRef) {
        observerRef.current.unobserve(currentSentryRef);
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  // Cleanup przy unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return sentryRef;
};
