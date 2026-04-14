"use client"

import { useEffect, useState } from "react"
import { AuthUser, getAuthUser } from "@/lib/auth"

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setUser(getAuthUser())
    setIsHydrated(true)
  }, [])

  return { user, isHydrated, setUser }
}
