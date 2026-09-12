import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // Use updateSession to ensure tokens are refreshed if needed
  let response = await updateSession(request)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_offline_build';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/update-password') ||
    request.nextUrl.pathname.startsWith('/admin/login') ||
    request.nextUrl.pathname.startsWith('/admin/signup') ||
    request.nextUrl.pathname.startsWith('/admin/forgot-password') ||
    request.nextUrl.pathname.startsWith('/admin/update-password')

  const isRestaurantRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/onboarding')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login') && !request.nextUrl.pathname.startsWith('/admin/signup') && !request.nextUrl.pathname.startsWith('/admin/forgot-password') && !request.nextUrl.pathname.startsWith('/admin/update-password')


  if (isAuthRoute) {
    if (user) {
      // If user is already logged in, redirect them away from auth pages
      if (request.nextUrl.pathname.startsWith('/admin')) {
         return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  if (isRestaurantRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
