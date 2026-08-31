const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/$/, '');

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('medimind_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE}${cleanEndpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('medimind_user');
    localStorage.removeItem('medimind_token');
    if (!window.location.pathname.includes('/auth/login')) {
      window.location.href = '/auth/login?expired=true';
    }
  }


  if (!response.ok) {

    let errorDetail = 'An unexpected error occurred';
    try {
      const data = await response.json();
      errorDetail = data.detail || JSON.stringify(data);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
