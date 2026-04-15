"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { Button } from "@/components/ui/button"

interface DashboardMetrics {
  totalClients: number
  totalOrders: number
  activeOrders: number
  completedOrders: number
  pendingReturns: number
  totalRevenue: number
  totalRefunds: number
  netRevenue: number
}

interface DashboardClient {
  id: string
  name: string
  email: string
  phone?: string
  joinedAt: string
  totalOrders: number
  totalQuoted: number
  totalPaid: number
  totalRefunded: number
}

interface DashboardOrder {
  _id: string
  orderNumber: string
  title: string
  status: string
  client: {
    name: string
    email: string
  }
  returnRequest: {
    status: "none" | "pending" | "approved" | "rejected"
    reason?: string
  }
  payment: {
    amountPaid: number
  }
}

interface DashboardResponse {
  metrics: DashboardMetrics
  clients: DashboardClient[]
  recentOrders: DashboardOrder[]
  returnRequests: DashboardOrder[]
}

const money = (value: number) => `INR ${value.toFixed(2)}`

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientOrders, setClientOrders] = useState<DashboardOrder[]>([])
  const [loadingClientOrders, setLoadingClientOrders] = useState(false)
  const { user, isHydrated } = useAuthUser()

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const payload = await apiRequest<DashboardResponse>("/api/admin/dashboard")
      setData(payload)
      setError("")
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Unable to load admin dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadDashboard()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  const resolveReturn = async (orderId: string, decision: "approved" | "rejected", maxRefund: number) => {
    setProcessingOrderId(orderId)
    try {
      await apiRequest(`/api/orders/${orderId}/return-decision`, {
        method: "PATCH",
        body: {
          decision,
          refundAmount: decision === "approved" ? maxRefund : 0,
          returnContent: decision === "approved",
        },
      })
      await loadDashboard()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Unable to process return request")
      }
    } finally {
      setProcessingOrderId("")
    }
  }

  const handleDeleteUsers = async () => {
    if (!confirm("Delete all client users?")) return
    try {
      const res = await apiRequest<{message:string}>("/api/admin/users", { method: "DELETE" })
      alert(res.message)
      loadDashboard()
    } catch (err) {
      alert("Error deleting users")
    }
  }

  const handleDeleteOrders = async () => {
    if (!confirm("Delete all orders?")) return
    try {
      const res = await apiRequest<{message:string}>("/api/admin/orders", { method: "DELETE" })
      alert(res.message)
      loadDashboard()
    } catch (err) {
      alert("Error deleting orders")
    }
  }

  const handleDeleteTransactions = async () => {
    if (!confirm("Delete all transactions?")) return
    try {
      const res = await apiRequest<{message:string}>("/api/admin/transactions", { method: "DELETE" })
      alert(res.message)
      loadDashboard()
    } catch (err) {
      alert("Error deleting transactions")
    }
  }

  const deliverOrder = async (orderId: string) => {
    if (!confirm("Mark this order as delivered?")) return
    try {
      await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status: "completed", progress: 100 },
      })
      alert("Order delivered!")
      loadDashboard()
    } catch (err) {
      alert("Error delivering order")
    }
  }

  const loadClientOrders = async (clientId: string) => {
    setSelectedClientId(clientId)
    setLoadingClientOrders(true)
    try {
      const orders = await apiRequest<DashboardOrder[]>(`/api/admin/orders?clientId=${clientId}`)
      setClientOrders(orders)
    } catch (err) {
      setClientOrders([])
    } finally {
      setLoadingClientOrders(false)
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order?")) return
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: "DELETE" })
      setClientOrders(prev => prev.filter(o => o._id !== orderId))
      loadDashboard()
    } catch (err) {
      alert("Error deleting order")
    }
  }

  if (!isHydrated) {
    return (
      <AppShell showNav={false}>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell showNav={false}>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please login with an admin account to continue.</p>
          <Link href="/login" className="mt-4 inline-block font-semibold text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </AppShell>
    )
  }

  if (user.role !== "admin") {
    return (
      <AppShell>
        <PageHeader title="Dashboard" backHref="/" />
        <div className="mx-auto max-w-lg px-4 py-8 text-center">
          <p className="text-muted-foreground">This dashboard is available for admin users only.</p>
          <Link href="/orders" className="mt-3 inline-block font-semibold text-primary hover:underline">
            View my orders
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell showNav={false}>
      <PageHeader title="Admin Dashboard" backHref="/" />
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        ) : null}

        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!loading && data ? (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold text-foreground">{data.metrics.totalClients}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{data.metrics.totalOrders}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold text-foreground">{data.metrics.activeOrders}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Pending Returns</p>
                <p className="text-2xl font-bold text-foreground">{data.metrics.pendingReturns}</p>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold text-foreground">{money(data.metrics.totalRevenue)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Refunds</p>
                <p className="text-lg font-bold text-foreground">{money(data.metrics.totalRefunds)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Net Revenue</p>
                <p className="text-lg font-bold text-foreground">{money(data.metrics.netRevenue)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Completed Orders</p>
                <p className="text-2xl font-bold text-foreground">{data.metrics.completedOrders}</p>
              </div>
            </section>

            <section className="rounded-xl border border-destructive/20 bg-card p-4">
              <h2 className="mb-3 text-lg font-semibold text-destructive">Danger Zone</h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="destructive" onClick={handleDeleteUsers}>Delete All Clients</Button>
                <Button variant="destructive" onClick={handleDeleteOrders}>Delete All Orders</Button>
                <Button variant="destructive" onClick={handleDeleteTransactions}>Delete Transactions</Button>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Pending Return Requests</h2>
                <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
                  View Transactions
                </Link>
              </div>
              <div className="space-y-3">
                {data.returnRequests.length ? (
                  data.returnRequests.map((order) => (
                    <div key={order._id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.client?.name} ({order.client?.email})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reason: {order.returnRequest?.reason || "No reason provided"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={() => resolveReturn(order._id, "approved", order.payment?.amountPaid || 0)}
                            disabled={processingOrderId === order._id}
                          >
                            Approve + Refund
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => resolveReturn(order._id, "rejected", 0)}
                            disabled={processingOrderId === order._id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No pending return requests.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Client Overview</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-2 py-2">Client</th>
                      <th className="px-2 py-2">Contact</th>
                      <th className="px-2 py-2">Orders</th>
                      <th className="px-2 py-2">Paid</th>
                      <th className="px-2 py-2">Refunded</th>
                      <th className="px-2 py-2">Net</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients.map((client) => (
                      <tr key={client.id} className="border-b border-border/70">
                        <td className="px-2 py-2 font-medium text-foreground">{client.name}</td>
                        <td className="px-2 py-2 text-muted-foreground">{client.email}</td>
                        <td className="px-2 py-2 text-foreground">{client.totalOrders}</td>
                        <td className="px-2 py-2 text-foreground">{money(client.totalPaid)}</td>
                        <td className="px-2 py-2 text-foreground">{money(client.totalRefunded)}</td>
                        <td className="px-2 py-2 font-semibold text-foreground">
                          {money(client.totalPaid - client.totalRefunded)}
                        </td>
                        <td className="px-2 py-2">
                          <Button size="sm" variant="outline" onClick={() => loadClientOrders(client.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {selectedClientId && (
              <section className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Client Orders</h2>
                  <Button size="sm" variant="outline" onClick={() => setSelectedClientId(null)}>
                    Close
                  </Button>
                </div>
                {loadingClientOrders ? (
                  <div className="h-20 animate-pulse rounded bg-muted" />
                ) : clientOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders found.</p>
                ) : (
                  <div className="space-y-2">
                    {clientOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-medium text-foreground">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {order.status} | Paid: ₹{order.payment?.amountPaid || 0}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {order.status !== "completed" && (
                            <Button size="sm" className="bg-success" onClick={() => deliverOrder(order._id)}>
                              Deliver
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteOrder(order._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
