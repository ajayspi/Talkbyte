const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function getOrders(restaurantId: string) {
  return apiCall(`/api/orders?restaurant_id=${restaurantId}`);
}

export async function createOrder(data: any) {
  return apiCall('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
