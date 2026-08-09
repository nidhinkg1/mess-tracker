const API_BASE_URL = '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Differentiate 401 unauthenticated response from generic errors
      if (response.status === 401 && typeof window !== 'undefined') {
        const isPublicPage =
          window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/register') ||
          window.location.pathname.startsWith('/share/');

        if (!isPublicPage) {
          window.location.href = '/login?session_expired=true';
        }
      }
      throw new Error(data.error || 'An error occurred while communicating with the server');
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}

export async function fetchCurrentUser(): Promise<any | null> {
  try {
    return await fetchApi('/auth/me');
  } catch (error) {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetchApi('/auth/logout', { method: 'POST' });
  } catch (error) {
    // Session already invalidated
  }
}
