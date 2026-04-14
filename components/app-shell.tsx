"use client"

import { BottomNav } from "./bottom-nav"

interface AppShellProps {
  children: React.ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={showNav ? "pb-20 md:pb-0" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
