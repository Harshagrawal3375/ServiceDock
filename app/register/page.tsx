"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { apiRequest, ApiError } from "@/lib/api"
import { AuthUser, setAuthSession, UserRole } from "@/lib/auth"

interface AuthResponse {
  token: string
  user: AuthUser
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("client")
  const [adminRegistrationCode, setAdminRegistrationCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await apiRequest<AuthResponse>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: {
          name,
          email,
          phone,
          password,
          role,
          adminRegistrationCode: role === "admin" ? adminRegistrationCode : undefined,
        },
      })

      setAuthSession(response.token, response.user)
      router.push(response.user.role === "admin" ? "/dashboard" : "/")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : "Unable to register right now")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Join as client to place tasks, or admin to manage clients and transactions.
        </p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
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
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary"
              placeholder="+91 99999 99999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-foreground">
              Account Role
            </label>
            <select
              id="role"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === "admin" ? (
            <div className="sm:col-span-2">
              <label htmlFor="adminCode" className="mb-1.5 block text-sm font-medium text-foreground">
                Admin Registration Code
              </label>
              <input
                id="adminCode"
                type="text"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary"
                placeholder="Enter admin code"
                value={adminRegistrationCode}
                onChange={(e) => setAdminRegistrationCode(e.target.value)}
              />
            </div>
          ) : null}

          {error ? (
            <div className="sm:col-span-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="sm:col-span-2 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
