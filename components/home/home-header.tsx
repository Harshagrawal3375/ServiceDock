"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HomeHeader() {
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
