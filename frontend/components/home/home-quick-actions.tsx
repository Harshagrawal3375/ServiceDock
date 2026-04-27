"use client"

import Link from "next/link"
import { Store, HelpCircle, Star, ClipboardList } from "lucide-react"
import { useEffect, useState } from "react"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthToken } from "@/hooks/use-auth-token"

interface OrderItem {
  _id: string
}

export function HomeQuickActions() {
  const { token, isHydrated } = useAuthToken()
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    if (!token) return
    apiRequest<OrderItem[]>("/api/orders")
      .then(data => setOrderCount(data.length))
      .catch(() => {})
  }, [token])

  const quickActions = [
    {
      title: "My Orders",
      description: orderCount > 0 ? `${orderCount} orders placed` : "View your orders",
      icon: ClipboardList,
      href: "/orders",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Digital Store",
      description: "Notes, templates & more",
      icon: Store,
      href: "/store",
      color: "bg-info/10 text-info",
    },
    {
      title: "How it works",
      description: "Learn about our process",
      icon: HelpCircle,
      href: "#",
      color: "bg-warning/10 text-warning",
    },
    {
      title: "Reviews",
      description: "See what students say",
      icon: Star,
      href: "#",
      color: "bg-success/10 text-success",
    },
  ]

  return (
    <section className="pb-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link 
            key={action.title}
            href={action.href}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
