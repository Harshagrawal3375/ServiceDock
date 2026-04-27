"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface ServiceCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  gradient?: boolean
}

export function ServiceCard({ title, description, icon: Icon, href, gradient = false }: ServiceCardProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        gradient 
          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" 
          : "bg-card border border-border hover:border-primary/30"
      )}>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110",
          gradient 
            ? "bg-primary-foreground/20" 
            : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            gradient ? "text-primary-foreground" : "text-primary"
          )} />
        </div>
        <h3 className={cn(
          "font-semibold text-base mb-1",
          !gradient && "text-card-foreground"
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-sm",
          gradient ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {description}
        </p>
        <div className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-300 group-hover:scale-150",
          gradient ? "bg-primary-foreground/10" : "bg-primary/5"
        )} />
      </div>
    </Link>
  )
}
