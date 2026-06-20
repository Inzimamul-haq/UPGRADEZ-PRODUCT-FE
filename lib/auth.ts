let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (t: string) => { accessToken = t; };
export const clearAccessToken = () => { accessToken = null; };

export async function refreshAccessToken() {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (res.ok) {
      const { token } = await res.json();
      setAccessToken(token);
    } else {
      clearAccessToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  } catch (error) {
    clearAccessToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
