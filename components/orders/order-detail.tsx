"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Download,
  MessageCircle,
  FileText,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"

interface OrderDetailProps {
  orderId: string
}

type OrderStatus =
  | "pending"
  | "accepted"
  | "in-progress"
  | "completed"
  | "returned"
  | "refunded"
  | "cancelled"

interface OrderResponse {
  _id: string
  orderNumber: string
  title: string
  serviceType: string
  status: OrderStatus
  progress: number
  subject: string
  instructions: string
  files: string[]
  deadline?: string
  createdAt: string
  delivery: {
    note?: string
    files?: string[]
    deliveredAt?: string
  }
  pricing: {
    quotedPrice: number
    finalPrice: number
  }
  payment: {
    status: "unpaid" | "partial" | "paid" | "refunded"
    amountPaid: number
    amountRefunded: number
    currency: string
    lastPaidAt?: string
  }
  returnRequest: {
    status: "none" | "pending" | "approved" | "rejected"
    reason?: string
    requestedAt?: string
    reviewedAt?: string
    adminComment?: string
    refundAmount?: number
  }
}

interface TransactionItem {
  _id: string
  transactionId: string
  type: "payment" | "refund"
  status: "initiated" | "success" | "failed"
  amount: number
  method: string
  createdAt: string
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-warning text-warning bg-warning/10" },
  accepted: { label: "Accepted", className: "border-info text-info bg-info/10" },
  "in-progress": { label: "In Progress", className: "border-info text-info bg-info/10" },
  completed: { label: "Completed", className: "border-success text-success bg-success/10" },
  returned: { label: "Returned", className: "border-warning text-warning bg-warning/10" },
  refunded: { label: "Refunded", className: "border-success text-success bg-success/10" },
  cancelled: { label: "Cancelled", className: "border-destructive text-destructive bg-destructive/10" },
}

const formatDateTime = (date?: string) => {
  if (!date) return "N/A"
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatPrice = (amount: number, currency = "INR") => `${currency} ${amount.toFixed(2)}`

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [returnReason, setReturnReason] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: currentUser } = useAuthUser()

  const loadData = async () => {
    try {
      const [orderData, transactionData] = await Promise.all([
        apiRequest<OrderResponse>(`/api/orders/${orderId}`),
        apiRequest<TransactionItem[]>(`/api/transactions?orderId=${orderId}`),
      ])
      setOrder(orderData)
      setTransactions(transactionData)
      setError("")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Unable to load order details")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const status = useMemo(() => {
    if (!order) return statusConfig.pending
    return statusConfig[order.status]
  }, [order])

  const requestReturn = async () => {
    if (!order) return
    setActionMessage("")
    setIsSubmitting(true)

    try {
      await apiRequest(`/api/orders/${order._id}/return-request`, {
        method: "POST",
        body: { reason: returnReason },
      })
      setActionMessage("Return request sent to admin.")
      setReturnReason("")
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) setActionMessage(err.message)
      else setActionMessage("Unable to request return")
    } finally {
      setIsSubmitting(false)
    }
  }

  const processReturn = async (decision: "approved" | "rejected") => {
    if (!order) return
    setActionMessage("")
    setIsSubmitting(true)

    try {
      await apiRequest(`/api/orders/${order._id}/return-decision`, {
        method: "PATCH",
        body: {
          decision,
          refundAmount: decision === "approved" ? Number(refundAmount || order.payment.amountPaid) : 0,
          returnContent: decision === "approved",
        },
      })
      setActionMessage(`Return request ${decision}.`)
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) setActionMessage(err.message)
      else setActionMessage("Unable to process return request")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        {error || "Order not found"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground">{order.orderNumber}</p>
            <h2 className="text-lg font-semibold text-foreground">{order.title}</h2>
            <p className="text-sm text-muted-foreground">{order.serviceType}</p>
          </div>
          <Badge variant="outline" className={cn("text-xs", status.className)}>
            {status.label}
          </Badge>
        </div>

        {!["completed", "returned", "refunded", "cancelled"].includes(order.status) ? (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{order.progress}%</span>
            </div>
            <Progress value={order.progress} className="h-2.5" />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="text-sm font-medium text-foreground">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Final Price</p>
              <p className="text-sm font-medium text-foreground">
                {formatPrice(order.pricing.finalPrice, order.payment.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-semibold text-foreground">Order Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="text-sm text-foreground">{order.subject}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Instructions</p>
            <p className="text-sm text-foreground">{order.instructions || "No instructions provided"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uploaded Files</p>
            {order.files?.length ? (
              <div className="mt-1 space-y-1">
                {order.files.map((file) => (
                  <div key={file} className="flex items-center gap-2 text-sm text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    {file}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No files uploaded</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-semibold text-foreground">Payment & Refund Summary</h3>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className="font-semibold text-foreground">{formatPrice(order.payment.amountPaid, order.payment.currency)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Refunded</p>
            <p className="font-semibold text-foreground">
              {formatPrice(order.payment.amountRefunded, order.payment.currency)}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Payment Status</p>
            <p className="font-semibold capitalize text-foreground">{order.payment.status}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-semibold text-foreground">Transactions</h3>
        <div className="space-y-2">
          {transactions.length ? (
            transactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{transaction.transactionId}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.type} via {transaction.method} | {formatDateTime(transaction.createdAt)}
                  </p>
                </div>
                <p className={cn("text-sm font-semibold", transaction.type === "refund" ? "text-warning" : "text-success")}>
                  {transaction.type === "refund" ? "-" : "+"}
                  {formatPrice(transaction.amount, order.payment.currency)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
          )}
        </div>
      </div>

      {order.returnRequest.status !== "none" ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-2 font-semibold text-foreground">Return Request</h3>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium capitalize text-foreground">{order.returnRequest.status}</span>
          </p>
          {order.returnRequest.reason ? (
            <p className="mt-2 text-sm text-foreground">Reason: {order.returnRequest.reason}</p>
          ) : null}
          {order.returnRequest.adminComment ? (
            <p className="mt-1 text-sm text-foreground">Admin Comment: {order.returnRequest.adminComment}</p>
          ) : null}

          {currentUser?.role === "admin" && order.returnRequest.status === "pending" ? (
            <div className="mt-4 space-y-3">
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                placeholder={`Refund amount (max ${order.payment.amountPaid})`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                  disabled={isSubmitting}
                  onClick={() => processReturn("approved")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve Return
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={isSubmitting}
                  onClick={() => processReturn("rejected")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {currentUser?.role === "client" && order.status === "completed" && order.returnRequest.status === "none" ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-2 font-semibold text-foreground">Need a Return?</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            You can request content return and refund. Admin will review your request.
          </p>
          <textarea
            className="min-h-[90px] w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-primary"
            placeholder="Explain why you want to return this order..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <Button className="mt-3 w-full" disabled={isSubmitting} onClick={requestReturn}>
            Request Return & Refund
          </Button>
        </div>
      ) : null}

      {actionMessage ? (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {actionMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {order.delivery?.files?.length ? (
          <Button className="h-12 w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Download className="mr-2 h-5 w-5" />
            Download Delivered Files
          </Button>
        ) : null}
        <Button variant="outline" className="h-12 w-full" asChild>
          <Link href="/chat">
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Support
          </Link>
        </Button>
      </div>
    </div>
  )
}
