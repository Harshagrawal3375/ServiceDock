"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function HomeSearch() {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input 
        placeholder="What do you need help with?"
        className="pl-12 h-12 rounded-xl bg-card border-border focus:border-primary text-base"
      />
    </div>
  )
}
