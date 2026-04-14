"use client"

import { useEffect, useState } from "react"
import { getAuthToken } from "@/lib/auth"

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setToken(getAuthToken())
    setIsHydrated(true)
  }, [])

  return { token, isHydrated, setToken }
}
