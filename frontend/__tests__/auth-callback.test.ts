import { NextRequest } from 'next/server';
import { GET } from '@/app/auth/callback/route';

const mockExchangeCodeForSession = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn().mockImplementation(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    })
  ),
}));

describe('Auth Callback Route Handler (GET /auth/callback)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
  });

  describe('CWE-601 Open Redirect Prevention', () => {
    it('redirects to /dashboard by default when next param is omitted', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('allows safe relative paths such as /dashboard and /admin', async () => {
      const req1 = new NextRequest('http://localhost:3000/auth/callback?next=/dashboard');
      const res1 = await GET(req1);
      expect(res1.headers.get('location')).toBe('http://localhost:3000/dashboard');

      const req2 = new NextRequest('http://localhost:3000/auth/callback?next=/admin');
      const res2 = await GET(req2);
      expect(res2.headers.get('location')).toBe('http://localhost:3000/admin');
    });

    it('allows relative paths with query parameters and hash fragments', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=/dashboard/orders?tab=active#details'
      );
      const res = await GET(req);
      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/dashboard/orders?tab=active#details'
      );
    });

    it('blocks absolute external URLs (https://attacker.com) and falls back to /dashboard', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://attacker.com/steal-token'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks protocol-relative URLs (//attacker.com) and falls back to /dashboard', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=//attacker.com/phish'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks backslash normalization bypasses (/\\attacker.com)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=/\\attacker.com'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks pseudo-protocols (javascript: and data:)', async () => {
      const req1 = new NextRequest(
        'http://localhost:3000/auth/callback?next=javascript:alert(1)'
      );
      const res1 = await GET(req1);
      expect(res1.headers.get('location')).toBe('http://localhost:3000/dashboard');

      const req2 = new NextRequest(
        'http://localhost:3000/auth/callback?next=data:text/html,<script>alert(1)</script>'
      );
      const res2 = await GET(req2);
      expect(res2.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('falls back to /admin when role=operator_admin and next is external', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://attacker.com&role=operator_admin'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/admin');
    });

    it('falls back to /admin when type=admin and next is missing', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?type=admin');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/admin');
    });

    it('respects safe custom fallback parameter when next is invalid', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://attacker.com&fallback=/dashboard/settings'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard/settings');
    });

    it('blocks malicious fallback parameter (https://attacker.com) and defaults to /dashboard', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://evil.com&fallback=https://attacker.com'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks protocol-relative fallback parameter (//attacker.com) and defaults to /dashboard', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://evil.com&fallback=//attacker.com'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks multi-slash protocol-relative URLs (///attacker.com and ////attacker.com)', async () => {
      const req1 = new NextRequest(
        'http://localhost:3000/auth/callback?next=///attacker.com'
      );
      const res1 = await GET(req1);
      expect(res1.status).toBe(307);
      expect(res1.headers.get('location')).toBe('http://localhost:3000/dashboard');

      const req2 = new NextRequest(
        'http://localhost:3000/auth/callback?next=////attacker.com'
      );
      const res2 = await GET(req2);
      expect(res2.status).toBe(307);
      expect(res2.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks plain http URLs (http://attacker.com/evil)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=http://attacker.com/evil'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks backslash traversal attacks (/dashboard\\..\\..\\attacker.com)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=/dashboard\\..\\..\\attacker.com'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks userinfo bypass attempts (https://attacker.com@localhost:3000)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://attacker.com@localhost:3000'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('safely retains same-origin destination when path resembles external host (/localhost:3000.attacker.com)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=/localhost:3000.attacker.com'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/localhost:3000.attacker.com'
      );
    });
  });

  describe('Invalid URL & TypeError Crash Protection', () => {
    it('handles malformed URL strings like http:// without throwing 500 error', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=http://');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('handles empty or whitespace next strings gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=%20%20');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('handles ASCII control characters in next gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=%00%0D%0A/evil');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('handles embedded null byte in relative path gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=/dashboard%00/secret');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Supabase PKCE Code Exchange', () => {
    it('exchanges code for session when code parameter is present', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?code=valid-pkce-auth-code&next=/dashboard'
      );
      const res = await GET(req);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-pkce-auth-code');
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('catches session exchange errors gracefully in offline/demo mode and still redirects', async () => {
      mockExchangeCodeForSession.mockRejectedValueOnce(
        new Error('Supabase unreachable')
      );
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?code=invalid-code&next=/dashboard'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });
});
