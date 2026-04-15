"use client"

import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRouter } from "next/navigation"
import { clearAuthSession } from "@/lib/auth"

export function HomeHeader() {
  const { user, isHydrated } = useAuthUser()
  const router = useRouter()

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      clearAuthSession()
      router.push("/login")
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SH</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground leading-tight">
              Student Help Hub
            </h1>
            <p className="text-xs text-muted-foreground">Your academic partner</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHydrated && user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
