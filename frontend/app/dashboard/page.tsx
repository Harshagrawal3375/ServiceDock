"use client"

import { useEffect, useState } from "react"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Settings,
  FileText,
  FileSpreadsheet,
  Minimize2,
  ArrowLeftRight,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"

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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/transactions", label: "Transactions", icon: FileText, adminOnly: true },
  { href: "/admin/converter", label: "Converter", icon: ArrowLeftRight, adminOnly: true },
  { href: "/admin/compressor", label: "Compressor", icon: Minimize2, adminOnly: true },
  { href: "/store", label: "Store", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
]

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: { 
  title: string
  value: string | number
  icon: any
  trend?: "up" | "down"
  className?: string
}) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {trend && (
        <div className={cn(
          "mt-1 flex items-center gap-1 text-xs",
          trend === "up" ? "text-success" : "text-destructive"
        )}>
          {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>vs last month</span>
        </div>
      )}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 transition-transform duration-300 group-hover:scale-150" />
    </div>
  )
}

function RevenueCard({ 
  title, 
  value, 
  type 
}: { 
  title: string
  value: number
  type: "success" | "warning" | "neutral"
}) {
  const colors = {
    success: "text-success",
    warning: "text-warning",
    neutral: "text-foreground"
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={cn("text-xl font-bold", colors[type])}>{money(value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientOrders, setClientOrders] = useState<DashboardOrder[]>([])
  const [loadingClientOrders, setLoadingClientOrders] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)
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

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await apiRequest("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (err) {
      window.location.href = "/login"
    } finally {
      setLoggingOut(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please login with an admin account to continue.</p>
          <a href="/login" className="mt-4 inline-block font-semibold text-primary hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">This dashboard is available for admin users only.</p>
          <a href="/orders" className="mt-3 inline-block font-semibold text-primary hover:underline">
            View my orders
          </a>
        </div>
      </div>
    )
  }

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== "admin") return false
    return true
  })

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={cn(
        "w-64 bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:relative",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-border">
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SH</span>
            </div>
            <span className="font-semibold text-foreground">Student Helper</span>
          </a>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Back to Home
          </a>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <form className="hidden md:block relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user?.name || "Admin"}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <a
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </a>
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <LogOut className="h-4 w-4" />
                        {loggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-28 animate-pulse rounded-2xl bg-muted" />
                <div className="h-28 animate-pulse rounded-2xl bg-muted" />
                <div className="h-28 animate-pulse rounded-2xl bg-muted" />
                <div className="h-28 animate-pulse rounded-2xl bg-muted" />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {!loading && data ? (
              <>
                <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <StatCard title="Total Clients" value={data.metrics.totalClients} icon={Users} trend="up" />
                  <StatCard title="Total Orders" value={data.metrics.totalOrders} icon={ShoppingCart} trend="up" />
                  <StatCard title="Active Orders" value={data.metrics.activeOrders} icon={Clock} />
                  <StatCard title="Pending Returns" value={data.metrics.pendingReturns} icon={AlertTriangle} />
                </section>

                <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <RevenueCard title="Total Revenue" value={data.metrics.totalRevenue} type="success" />
                  <RevenueCard title="Refunds" value={data.metrics.totalRefunds} type="warning" />
                  <RevenueCard title="Net Revenue" value={data.metrics.netRevenue} type="success" />
                  <StatCard title="Completed" value={data.metrics.completedOrders} icon={CheckCircle} />
                </section>

                <section className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Pending Return Requests</h2>
                    <a href="/transactions" className="text-sm font-medium text-primary hover:underline">
                      View All Transactions
                    </a>
                  </div>
                  <div className="space-y-3">
                    {data.returnRequests.length ? (
                      data.returnRequests.map((order) => (
                        <div key={order._id} className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div>
                            <p className="font-semibold text-foreground">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.client?.name} ({order.client?.email})
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
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
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">No pending return requests</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Client Overview</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="px-3 py-3">Client</th>
                          <th className="px-3 py-3">Contact</th>
                          <th className="px-3 py-3">Orders</th>
                          <th className="px-3 py-3">Paid</th>
                          <th className="px-3 py-3">Refunded</th>
                          <th className="px-3 py-3">Net</th>
                          <th className="px-3 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.clients.map((client) => (
                          <tr key={client.id} className="border-b border-border/70 hover:bg-muted/50">
                            <td className="px-3 py-3 font-medium text-foreground">{client.name}</td>
                            <td className="px-3 py-3 text-muted-foreground">{client.email}</td>
                            <td className="px-3 py-3 text-foreground">{client.totalOrders}</td>
                            <td className="px-3 py-3 text-success">{money(client.totalPaid)}</td>
                            <td className="px-3 py-3 text-warning">{money(client.totalRefunded)}</td>
                            <td className="px-3 py-3 font-semibold text-foreground">
                              {money(client.totalPaid - client.totalRefunded)}
                            </td>
                            <td className="px-3 py-3">
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
                  <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-foreground">Client Orders</h2>
                      <Button size="sm" variant="outline" onClick={() => setSelectedClientId(null)}>
                        Close
                      </Button>
                    </div>
                    {loadingClientOrders ? (
                      <div className="h-20 animate-pulse rounded bg-muted" />
                    ) : clientOrders.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">No orders found</p>
                    ) : (
                      <div className="space-y-2">
                        {clientOrders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between rounded-xl border border-border p-4">
                            <div>
                              <p className="font-medium text-foreground">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">{order.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
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

                <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                  <h2 className="mb-3 text-lg font-semibold text-destructive">Danger Zone</h2>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="destructive" onClick={handleDeleteUsers} className="text-xs">
                      Delete All Clients
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteOrders} className="text-xs">
                      Delete All Orders
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteTransactions} className="text-xs">
                      Delete Transactions
                    </Button>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}