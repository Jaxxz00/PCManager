import { QueryClient, type QueryFunction } from "@tanstack/react-query";

// Cache per sessionId per evitare letture ripetute da localStorage
let cachedSessionId: string | null = null;
let lastSessionCheck = 0;
const SESSION_CACHE_DURATION = 1000; // 1 secondo

function getCachedSessionId(): string | null {
  const now = Date.now();
  if (now - lastSessionCheck > SESSION_CACHE_DURATION) {
    cachedSessionId = localStorage.getItem('sessionId');
    lastSessionCheck = now;
  }
  return cachedSessionId;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Read body exactly once to avoid "body stream already read" errors
    const raw = await res.text();
    const fallback = res.statusText || 'Errore di richiesta';
    
    if (!raw) {
      throw new Error(fallback);
    }
    
    try {
      const body = JSON.parse(raw);
      const message = body?.error || body?.message || fallback;
      throw new Error(message);
    } catch {
      // Not JSON, return raw text
      throw new Error(raw);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const sessionId = getCachedSessionId();
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (sessionId) {
    headers["Authorization"] = `Bearer ${sessionId}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const sessionId = getCachedSessionId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuti - i dati sono considerati freschi
      gcTime: 10 * 60 * 1000, // 10 minuti - i dati rimangono in cache
      retry: (failureCount, error: any) => {
        // Non riprovare per errori 401, 403, 404
        if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('404')) {
          return false;
        }
        return failureCount < 2; // Massimo 2 tentativi
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff esponenziale
    },
    mutations: {
      retry: false,
    },
  },
});

// Prefetch delle query più comuni per migliorare le performance
export function prefetchCommonQueries() {
  // Prefetch in background delle query usate frequentemente
  queryClient.prefetchQuery({
    queryKey: ["/api/assets/all-including-pcs"],
    staleTime: 5 * 60 * 1000,
  });

  queryClient.prefetchQuery({
    queryKey: ["/api/employees"],
    staleTime: 5 * 60 * 1000,
  });
}
