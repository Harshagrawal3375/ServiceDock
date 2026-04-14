"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { apiRequest, ApiError } from "@/lib/api"
import { AuthUser, setAuthSession } from "@/lib/auth"

interface AuthResponse {
  token: string
  user: AuthUser
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      })

      setAuthSession(response.token, response.user)
      router.push(response.user.role === "admin" ? "/dashboard" : "/")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : "Unable to login right now")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-background px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 md:grid-cols-2">
        <div className="hidden rounded-2xl border border-border/70 bg-card p-8 md:flex md:flex-col md:justify-between">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Student Helper Platform
            </p>
            <h1 className="text-3xl font-bold text-foreground">Client and Admin Workspace</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Manage assignments, tasks, PPT delivery, payments, and return/refund workflows from one platform.
            </p>
          </div>
          <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            Tip: Admin users are redirected to `/dashboard` after login.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-foreground">Login</h2>
          <p className="mt-1 text-sm text-muted-foreground">Access your account to place and manage orders.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            New user?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
