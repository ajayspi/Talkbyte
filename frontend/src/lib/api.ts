const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export type ApiError = Error & { status?: number };

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  accessToken?: string,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10000),
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const apiError = new Error(error.detail || error.error || `API error: ${response.status}`) as ApiError;
    apiError.status = response.status;
    throw apiError;
  }

  return response.json();
}

export async function getOrders(restaurantId: string) {
  return apiCall(`/api/orders/restaurant/${encodeURIComponent(restaurantId)}`);
}

export async function getHealth() {
  return apiCall<{ status: string; service: string }>('/health');
}
