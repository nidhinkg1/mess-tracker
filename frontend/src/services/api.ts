const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mess_token');
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mess_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mess_token');
    localStorage.removeItem('mess_user');
  }
}

export function getUser(): any | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('mess_user');
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}

export function setUser(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mess_user', JSON.stringify(user));
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If token is stale or user was deleted from DB, auto-clear token and redirect to login
    if ((response.status === 401 || (response.status === 404 && data.error === 'User not found')) && typeof window !== 'undefined') {
      removeToken();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true';
      }
    }
    throw new Error(data.error || 'An error occurred while communicating with the server');
  }

  return data;
}
