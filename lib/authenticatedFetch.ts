import { refreshAccessToken } from './auth';

let refreshPromise: Promise<void> | null = null;

async function refreshOnce(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * A wrapper around raw `fetch` that handles 401 Unauthorized responses
 * by attempting to refresh the token and retrying the request once.
 * 
 * IMPORTANT LIMITATION: If `init.body` is a ReadableStream or FormData with a stream,
 * it will be consumed on the first fetch call and the retry will send a broken/empty body.
 * Plain strings (like JSON.stringify payloads) are safe.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  let response = await fetch(input, init);

  if (response.status === 401) {
    try {
      await refreshOnce();
    } catch {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    
    // If the original request was aborted by the user/component, don't retry.
    if (init.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Retry once with refreshed token
    response = await fetch(input, init);
  }

  return response;
}
