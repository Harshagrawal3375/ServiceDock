"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { OrderCard } from "./order-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthToken } from "@/hooks/use-auth-token"

type OrderStatus =
  | "pending"
  | "accepted"
  | "in-progress"
  | "completed"
  | "returned"
  | "refunded"
  | "cancelled"

interface OrderItem {
  _id: string
  orderNumber: string
  title: string
  serviceType: string
  status: OrderStatus
  progress: number
  deadline?: string
  pricing: {
    finalPrice: number
  }
  payment: {
    status: "unpaid" | "partial" | "paid" | "refunded"
  }
}

const serviceLabelMap: Record<string, string> = {
  assignment: "Assignment Help",
  task: "Task Help",
  ppt: "PPT Making",
  project: "Mini Project",
  resume: "Resume Builder",
  demo: "Demo Service",
  other: "Other Academic Help",
}

const formatDate = (date?: string) => {
  if (!date) return "No deadline"
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function OrdersList() {
  const [activeTab, setActiveTab] = useState("all")
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { token, isHydrated } = useAuthToken()

  useEffect(() => {
    let isMounted = true

    const fetchOrders = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await apiRequest<OrderItem[]>("/api/orders")
        if (isMounted) {
          setOrders(data)
          setError("")
        }
      } catch (err) {
        if (!isMounted) return
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError("Unable to load orders right now")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchOrders()
    return () => {
      isMounted = false
    }
  }, [token])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.payment?.status === "unpaid") return false
      if (activeTab === "all") return true
      if (activeTab === "pending") return ["pending", "accepted"].includes(order.status)
      if (activeTab === "active") return order.status === "in-progress"
      if (activeTab === "completed") return order.status === "completed"
      if (activeTab === "returns") return ["returned", "refunded", "cancelled"].includes(order.status)
      return true
    })
  }, [activeTab, orders])

  if (!isHydrated) {
    return <div className="h-24 animate-pulse rounded-xl bg-muted" />
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Login to see your orders.</p>
        <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Go to Login
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-5">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
          <TabsTrigger value="returns" className="text-xs">Returns</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                id={order._id}
                displayId={order.orderNumber}
                title={order.title}
                service={serviceLabelMap[order.serviceType] || order.serviceType}
                status={order.status}
                progress={order.progress}
                deadline={formatDate(order.deadline)}
                price={order.pricing?.finalPrice || 0}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No orders found in this category</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
