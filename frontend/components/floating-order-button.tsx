"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FloatingOrderButton() {
  return (
    <Button
      asChild
      size="icon"
      className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50"
    >
      <Link href="/create-order">
        <Plus className="h-6 w-6" />
        <span className="sr-only">Create new order</span>
      </Link>
    </Button>
  )
}
