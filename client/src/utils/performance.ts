/**
 * Performance optimization utilities
 */

// Memoizza funzioni costose con cache LRU
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    
    // LRU: rimuovi elementi vecchi se cache piena
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, result);
    return result;
  }) as T;
}

// Throttle function per limitare chiamate frequenti
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  let lastResult: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      lastResult = fn(...args);
    }
    
    return lastResult;
  }) as T;
}