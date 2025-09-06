import React from 'react'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getCurrentSession, getCurrentUser } from './supabaseClient'
import { User } from '@supabase/supabase-js'

// Higher-order component for protected routes
export const withAuth = <P extends { user?: User }>(WrappedComponent: React.ComponentType<P>) => {
  return function AuthenticatedComponent(props: Omit<P, 'user'>) {
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const router = useRouter()

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const session = await getCurrentSession()
          if (!session) {
            router.push('/signup')
            return
          }
          
          const user = await getCurrentUser()
          setUser(user)
        } catch (error) {
          console.error('Auth check failed:', error)
          router.push('/signup')
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [router])

    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!user) {
      return null
    }

    return <WrappedComponent {...(props as P)} user={user} />
  }
}

// Hook for checking if user is admin
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = await getCurrentUser()
        setIsAdmin(user?.user_metadata?.role === 'admin')
      } catch (error) {
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  return { isAdmin, isLoading }
} 