export type UserRole = "client" | "admin"

export interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  createdAt?: string
  lastLoginAt?: string
}

const TOKEN_KEY = "student_helper_token"
const USER_KEY = "student_helper_user"

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}
