import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.remove(name)
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Protected routes
  const protectedRoutes = ['/app', '/admin', '/employer']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth routes
  const authRoutes = ['/signup', '/login', '/reset-password']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Public routes
  const publicRoutes = ['/', '/pricing', '/about']
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isProtectedRoute && !session) {
    // Redirect to login if not authenticated
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthRoute) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL('/app/dashboard', req.url))
  }

  // Role-based routing
  if (session && isProtectedRoute) {
    try {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single()

      const { data: user } = await supabase
        .from('users')
        .select('role, org_id')
        .eq('id', session.user.id)
        .single()

      const userRole = user?.role
      const hasOrg = !!user?.org_id

      // Route professionals to candidate dashboard
      if (userRole === 'professional') {
        if (pathname.startsWith('/employer') || pathname.startsWith('/admin')) {
          return NextResponse.redirect(new URL('/app/dashboard', req.url))
        }
      }

      // Route managers/admins to employer dashboard
      if (userRole === 'admin' || userRole === 'manager' || userRole === 'compliance_officer') {
        if (pathname.startsWith('/app') && !pathname.includes('/profile')) {
          return NextResponse.redirect(new URL('/employer/dashboard', req.url))
        }
      }

      // Redirect unassigned professionals to onboarding
      if (userRole === 'professional' && !profile) {
        if (!pathname.includes('/onboarding')) {
          return NextResponse.redirect(new URL('/app/onboarding', req.url))
        }
      }

    } catch (error) {
      console.error('Error in middleware:', error)
      // Continue with request if there's an error
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
