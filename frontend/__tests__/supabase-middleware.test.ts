import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient, updateSession } from '@/lib/supabase-middleware';

describe('Supabase Middleware Client & Session Synchronization', () => {
  it('mutates cookies directly on response and retains all cookies across multiple setItem calls', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'sb-access-token=initial_token',
      },
    });

    const res = NextResponse.next();
    const { supabase, response } = createMiddlewareClient(req, res);

    // Verify response is identical reference to res
    expect(response).toBe(res);

    // Trigger storage setItem directly via supabase client auth storage
    const authConfig = (supabase as any).auth;
    authConfig.storage.setItem('sb-access-token', 'new_access_token');
    authConfig.storage.setItem('sb-refresh-token', 'new_refresh_token');

    // Verify both cookies are present on the response object
    const cookies = response.cookies.getAll();
    const accessTokenCookie = cookies.find((c) => c.name === 'sb-access-token');
    const refreshTokenCookie = cookies.find((c) => c.name === 'sb-refresh-token');

    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.value).toBe('new_access_token');
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie?.value).toBe('new_refresh_token');
  });

  it('deletes cookie from both request and response in removeItem', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'sb-access-token=old_token',
      },
    });

    const { supabase, response } = createMiddlewareClient(req);
    const authConfig = (supabase as any).auth;
    authConfig.storage.removeItem('sb-access-token');

    expect(req.cookies.get('sb-access-token')).toBeUndefined();
    expect(response.cookies.get('sb-access-token')?.maxAge).toBe(0);
  });

  it('updateSession catches network exceptions cleanly and returns response', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard');
    const response = await updateSession(req);
    expect(response).toBeInstanceOf(NextResponse);
  });
});
