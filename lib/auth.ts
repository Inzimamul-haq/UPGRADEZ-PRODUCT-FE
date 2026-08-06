import axios from 'axios';

function getCsrfToken() {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + 'csrf-token' + ')=([^;]*)'));
    if (match) return decodeURIComponent(match[3]);
  }
  return '';
}

export async function refreshAccessToken() {
  try {
    const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/auth/refresh`, {}, {
      withCredentials: true,
      headers: {
        'x-csrf-token': getCsrfToken()
      }
    });
    return res.data;
  } catch (error) {
    if (typeof window !== 'undefined' && !['/login', '/signup', '/super-admin-register'].includes(window.location.pathname)) {
      window.location.href = '/login';
    }
    throw error;
  }
}

export async function logoutUser() {
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/auth/logout`, {}, {
      withCredentials: true,
      headers: {
        'x-csrf-token': getCsrfToken()
      }
    });
  } catch (error) {
    console.error('Logout failed', error);
  } finally {
    if (typeof window !== 'undefined' && !['/login', '/signup', '/super-admin-register'].includes(window.location.pathname)) {
      window.location.href = '/login';
    }
  }
}
