"use client"

import Link from "next/link"
import { ChevronRight, Clock, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  id: string
  displayId?: string
  title: string
  service: string
  status: "pending" | "accepted" | "in-progress" | "completed" | "returned" | "refunded" | "cancelled"
  progress: number
  deadline: string
  price: number
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "outline" as const,
    className: "border-warning text-warning bg-warning/10",
  },
  accepted: {
    label: "Accepted",
    variant: "outline" as const,
    className: "border-info text-info bg-info/10",
  },
  "in-progress": {
    label: "In Progress",
    variant: "outline" as const,
    className: "border-info text-info bg-info/10",
  },
  completed: {
    label: "Completed",
    variant: "outline" as const,
    className: "border-success text-success bg-success/10",
  },
  returned: {
    label: "Returned",
    variant: "outline" as const,
    className: "border-warning text-warning bg-warning/10",
  },
  refunded: {
    label: "Refunded",
    variant: "outline" as const,
    className: "border-success text-success bg-success/10",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline" as const,
    className: "border-destructive text-destructive bg-destructive/10",
  },
}

export function OrderCard({ 
  id, 
  displayId,
  title, 
  service, 
  status, 
  progress, 
  deadline, 
  price 
}: OrderCardProps) {
  const config = statusConfig[status]

  return (
    <Link href={`/orders/${id}`}>
      <div className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">{displayId || id}</span>
              <Badge variant={config.variant} className={cn("text-xs", config.className)}>
                {config.label}
              </Badge>
            </div>
            <h3 className="font-medium text-foreground truncate">{title}</h3>
            <p className="text-sm text-muted-foreground">{service}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>

        {!["completed", "returned", "refunded", "cancelled"].includes(status) && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {deadline}
            </span>
          </div>
          <span className="font-semibold text-foreground">Rs. {price}</span>
        </div>
      </div>
    </Link>
  )
}
