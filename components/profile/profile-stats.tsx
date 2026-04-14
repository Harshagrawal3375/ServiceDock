"use client"

import { useEffect, useState } from "react"
import { ClipboardList, CheckCircle, Wallet } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { useAuthToken } from "@/hooks/use-auth-token"

interface OrderItem {
  status: string
}

interface TransactionSummary {
  totalPaid: number
  totalRefunded: number
  netPaid: number
}

const formatMoney = (value: number) => `INR ${value.toFixed(0)}`

export function ProfileStats() {
  const { token } = useAuthToken()
  const [totalOrders, setTotalOrders] = useState(0)
  const [completedOrders, setCompletedOrders] = useState(0)
  const [wallet, setWallet] = useState(0)

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      if (!token) return

      try {
        const [orders, summary] = await Promise.all([
          apiRequest<OrderItem[]>("/api/orders"),
          apiRequest<TransactionSummary>("/api/transactions/summary"),
        ])

        if (!mounted) return
        setTotalOrders(orders.length)
        setCompletedOrders(orders.filter((item) => item.status === "completed").length)
        setWallet(summary.totalRefunded)
      } catch {
        if (!mounted) return
      }
    }

    loadStats()
    return () => {
      mounted = false
    }
  }, [token])

  const stats = [
    { label: "Total Orders", value: `${totalOrders}`, icon: ClipboardList, color: "text-primary" },
    { label: "Completed", value: `${completedOrders}`, icon: CheckCircle, color: "text-success" },
    { label: "Refunded", value: formatMoney(wallet), icon: Wallet, color: "text-warning" },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 text-center"
        >
          <stat.icon className={`mx-auto mb-2 h-6 w-6 ${stat.color}`} />
          <p className="text-lg font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
