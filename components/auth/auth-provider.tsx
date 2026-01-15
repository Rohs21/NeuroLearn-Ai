"use client"

import React, { useEffect, useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'

function SessionPersist({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    try {
      if (status === 'authenticated' && session) {
        // Persist a minimal, non-sensitive snapshot of the session to localStorage.
        // Do NOT store tokens or any secrets here. Store only safe, user-visible data.
        const safe = { user: session.user, expires: session.expires }
        localStorage.setItem('neuro_session', JSON.stringify(safe))
      } else if (status === 'unauthenticated') {
        localStorage.removeItem('neuro_session')
      }
    } catch (e) {
      // ignore localStorage failures
      console.error('[auth] localStorage error:', e)
    }
  }, [status, session, isMounted])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read an initial session snapshot from localStorage synchronously on first render
  // so the client can hydrate the session without an immediate fetch to the auth endpoint.
  const [initialSession] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('neuro_session') : null
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })

  return (
    <SessionProvider
      // Pass the safe, non-sensitive initial session to avoid an immediate client fetch
      // and reduce redundant round-trips on navigation. Keep refetch disabled so the
      // client doesn't repeatedly request the session on focus or interval.
      session={initialSession as any}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <SessionPersist>{children}</SessionPersist>
    </SessionProvider>
  )
}