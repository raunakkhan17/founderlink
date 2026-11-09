const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  requiresEmailVerification?: boolean;
  verificationStatus?: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/login')
    ) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData?.data?.accessToken) {
          localStorage.setItem('accessToken', refreshData.data.accessToken);
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          const retryRes = await fetch(url, { ...options, headers, credentials: 'include' });
          return await retryRes.json();
        }
      } catch {
        // Continue to error throw
      }
    }

    const error = new Error(data.message || `Request failed with status ${response.status}`) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
