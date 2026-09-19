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
    throw new Error(error.detail || error.error || `API error: ${response.status}`);
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

// ── AI Greeting Generator (R3) ──
export interface GenerateGreetingResponse {
  status: string;
  greeting: string;
  script?: string;
  provider: string;
}

export async function generateGreetingScript(
  restaurantName: string,
  persona: string = 'Aria',
  styleOrTone?: string
): Promise<GenerateGreetingResponse> {
  const data = await apiCall<GenerateGreetingResponse>('/api/voice/generate-greeting', {
    method: 'POST',
    body: JSON.stringify({
      restaurant_name: restaurantName,
      persona: persona,
      style_or_tone: styleOrTone,
    }),
  });

  return {
    ...data,
    script: data.greeting || data.script || '',
  };
}

// ── Staff Management (R1) ──
export interface StaffMemberInfo {
  id: string;
  restaurant_id?: string;
  user_id?: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffInviteResponse {
  status: string;
  user_id: string;
  message: string;
  staff?: StaffMemberInfo;
}

export interface StaffListResponse {
  staff: StaffMemberInfo[];
}

export async function inviteStaff(
  restaurantId: string,
  name: string,
  email: string,
  role: string
): Promise<StaffInviteResponse> {
  return apiCall<StaffInviteResponse>('/api/staff/invite', {
    method: 'POST',
    body: JSON.stringify({
      restaurant_id: restaurantId,
      name,
      email,
      role: role.toLowerCase(),
    }),
  });
}

export async function getStaff(restaurantId: string): Promise<StaffListResponse> {
  return apiCall<StaffListResponse>(
    `/api/staff?restaurant_id=${encodeURIComponent(restaurantId)}`
  );
}

// ── Integrations Management (R2) ──
export interface SaveIntegrationResponse {
  status: string;
  provider: string;
  connected: boolean;
}

export interface ProviderIntegrationInfo {
  connected: boolean;
  status: string;
  masked_key: string;
  metadata: Record<string, any>;
}

export interface IntegrationsResponse {
  integrations: Record<string, ProviderIntegrationInfo>;
}

export async function saveIntegration(
  restaurantId: string,
  provider: string,
  apiKey?: string,
  metadata?: Record<string, any>
): Promise<SaveIntegrationResponse> {
  return apiCall<SaveIntegrationResponse>('/api/integrations', {
    method: 'POST',
    body: JSON.stringify({
      restaurant_id: restaurantId,
      provider: provider.toLowerCase(),
      api_key: apiKey,
      metadata: metadata || {},
    }),
  });
}

export async function getIntegrations(
  restaurantId: string
): Promise<IntegrationsResponse> {
  return apiCall<IntegrationsResponse>(
    `/api/integrations?restaurant_id=${encodeURIComponent(restaurantId)}`
  );
}

export async function deleteIntegration(
  restaurantId: string,
  provider: string
): Promise<{ status: string; provider: string; connected: boolean }> {
  return apiCall<{ status: string; provider: string; connected: boolean }>(
    `/api/integrations/${encodeURIComponent(provider.toLowerCase())}?restaurant_id=${encodeURIComponent(restaurantId)}`,
    { method: 'DELETE' }
  );
}
