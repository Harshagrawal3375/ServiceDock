"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  backHref?: string
  action?: React.ReactNode
}

export function PageHeader({ title, backHref, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link href={backHref}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Go back</span>
              </Link>
            </Button>
          )}
          <h1 className="font-semibold text-lg text-foreground">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  )
}
