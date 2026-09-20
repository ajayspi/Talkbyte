import os
import re

supabase_path = r"c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\frontend\src\lib\supabase.ts"

with open(supabase_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace getPlatformStats
new_stats = """
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/admin/finance' || 'http://localhost:8000/api/admin/finance');
    if (response.ok) {
      const data = await response.json();
      return {
        ...MOCK_PLATFORM_STATS,
        mrrCents: data.mrr ? Math.round(data.mrr * 100) : MOCK_PLATFORM_STATS.mrrCents,
        cogsPerMinuteAud: data.cost_per_minute || MOCK_PLATFORM_STATS.cogsPerMinuteAud,
      };
    }
  } catch (e) {
    // ignore
  }
  return MOCK_PLATFORM_STATS;
}
"""
content = re.sub(
    r"export async function getPlatformStats\(\): Promise<PlatformStats> \{\s*return MOCK_PLATFORM_STATS;\s*\}",
    new_stats.strip(),
    content
)

# Replace getInfraServices
new_infra = """
export async function getInfraServices(): Promise<InfraService[]> {
  try {
    const { data, error } = await withTimeout(supabase.from('system_health_logs').select('*').order('created_at', { ascending: false }).limit(20));
    if (!error && data && data.length > 0) {
      return MOCK_INFRA_SERVICES.map(service => {
        const log = data.find(l => l.service_name.toLowerCase() === service.name.split(' ')[0].toLowerCase());
        if (log) {
          return {
            ...service,
            status: log.status === 'healthy' ? 'operational' : 'degraded',
            latencyMs: log.latency_ms || service.latencyMs
          };
        }
        return service;
      });
    }
  } catch (e) {
    // ignore
  }
  return MOCK_INFRA_SERVICES;
}
"""
content = re.sub(
    r"export async function getInfraServices\(\): Promise<InfraService\[\]> \{\s*return MOCK_INFRA_SERVICES;\s*\}",
    new_infra.strip(),
    content
)

# Replace getUsers
new_users = """
export async function getUsers(): Promise<RestaurantUser[]> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/admin/users' || 'http://localhost:8000/api/admin/users');
    if (response.ok) {
      const data = await response.json();
      if (data.users && data.users.users) {
        return data.users.users.map((u: any) => ({
          id: u.id,
          name: u.email.split('@')[0],
          email: u.email,
          role: 'admin',
          restaurant_id: 'admin',
          user_id: u.id,
          created_at: u.created_at
        }));
      }
    }
    const { data, error } = await withTimeout(supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false }));
    if (!error && data && data.length > 0) return data as unknown as RestaurantUser[];
  } catch {
    // Fall back to mock
  }
  return MOCK_USERS;
}
"""
content = re.sub(
    r"export async function getUsers\(\): Promise<RestaurantUser\[\]> \{.*?(?=\nexport async function getStaffMembers)/s",
    new_users.strip() + "\n\n",
    content,
    flags=re.DOTALL
)

with open(supabase_path, "w", encoding="utf-8") as f:
    f.write(content)

print("supabase.ts patched.")
