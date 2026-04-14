"use client"

import { useMemo } from "react"
import { Settings, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuthUser } from "@/hooks/use-auth-user"

export function ProfileHeader() {
  const { user } = useAuthUser()

  const initials = useMemo(() => {
    if (!user?.name) return "SH"
    return user.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }, [user?.name])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">{user?.name || "Guest User"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email || "Not logged in"}</p>
          <p className="mt-0.5 text-xs font-medium text-primary capitalize">
            {user?.role || "client"} account
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
