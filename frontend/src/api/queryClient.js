import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The stories endpoint is Redis-cached for 60s on the backend,
      // so treating data as fresh for the same window avoids refetching
      // something the API would only answer from its own cache.
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export default queryClient;
