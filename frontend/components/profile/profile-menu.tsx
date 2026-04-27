"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  FileText,
  Shield,
  LayoutDashboard,
  LogOut,
  Settings,
  FileArchive,
  ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearAuthSession } from "@/lib/auth"
import { useAuthUser } from "@/hooks/use-auth-user"

export function ProfileMenu() {
  const router = useRouter()
  const { user } = useAuthUser()

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      clearAuthSession()
      router.push("/login")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Account</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Link
            href="/transactions"
            className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">Payment History</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          {user?.role === "admin" ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
                    <LayoutDashboard className="h-5 w-5 text-info" />
                  </div>
                  <span className="font-medium text-foreground">Admin Dashboard</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Service Pricing</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link
                href="/admin/compressor"
                className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                    <FileArchive className="h-5 w-5 text-warning" />
                  </div>
                  <span className="font-medium text-foreground">PDF Compressor</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link
                href="/admin/converter"
                className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
                    <ArrowRightLeft className="h-5 w-5 text-info" />
                  </div>
                  <span className="font-medium text-foreground">File Converter</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Support</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Link
            href="/chat"
            className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                <HelpCircle className="h-5 w-5 text-warning" />
              </div>
              <span className="font-medium text-foreground">Help Center</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="#"
            className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">Terms & Conditions</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="#" className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <span className="font-medium text-foreground">Privacy Policy</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <Button
        variant="outline"
        className="h-12 w-full border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-5 w-5" />
        Logout
      </Button>
    </div>
  )
}
