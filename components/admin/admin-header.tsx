"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react"
import { useAuthUser } from "@/hooks/use-auth-user"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AdminHeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AdminHeader({ onMenuClick, showMenuButton }: AdminHeaderProps) {
  const { user } = useAuthUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await apiRequest("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (err) {
      window.location.href = "/login"
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <form onSubmit={handleSearch} className="hidden md:block relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground">
              {user?.name || "Admin"}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0" 
                onClick={() => setShowUserMenu(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}