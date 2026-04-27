"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  ArrowLeftRight,
  Minimize2,
  BarChart3,
  LogOut
} from "lucide-react"
import { useAuthUser } from "@/hooks/use-auth-user"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/transactions", label: "Transactions", icon: FileText, adminOnly: true },
  { href: "/admin/converter", label: "Converter", icon: ArrowLeftRight, adminOnly: true },
  { href: "/admin/compressor", label: "Compressor", icon: Minimize2, adminOnly: true },
  { href: "/store", label: "Store", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthUser()

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== "admin") return false
    return true
  })

  return (
    <aside className={cn("w-64 bg-card border-r border-border flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SH</span>
          </div>
          <span className="font-semibold text-foreground">Student Helper</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Back to Home
        </Link>
      </div>
    </aside>
  )
}