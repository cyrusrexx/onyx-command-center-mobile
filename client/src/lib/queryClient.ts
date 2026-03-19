import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// Detect static/GitHub Pages mode: no backend available
let staticMode: boolean | null = null;

async function fetchWithStaticFallback(url: string, init?: RequestInit): Promise<Response> {
  const fullUrl = `${API_BASE}${url}`;
  
  // If we already know we're in static mode, go straight to JSON files
  if (staticMode === true && (!init || init.method === "GET" || !init.method)) {
    const jsonUrl = `${url.replace(/^\//, "")}.json`;
    return fetch(jsonUrl);
  }
  
  const res = await fetch(fullUrl, init);
  
  // If the API 404s and it's a GET, try the static JSON fallback
  if (!res.ok && res.status === 404 && (!init || init.method === "GET" || !init.method)) {
    const jsonUrl = `${url.replace(/^\//, "")}.json`;
    const fallback = await fetch(jsonUrl);
    if (fallback.ok) {
      staticMode = true; // Remember we're in static mode
      return fallback;
    }
  }
  
  return res;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetchWithStaticFallback(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
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
    const url = queryKey.join("/");
    const res = await fetchWithStaticFallback(url);

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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
