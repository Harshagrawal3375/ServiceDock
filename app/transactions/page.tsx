"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthToken } from "@/hooks/use-auth-token"

interface TransactionItem {
  _id: string
  transactionId: string
  type: "payment" | "refund"
  status: "initiated" | "success" | "failed"
  amount: number
  method: string
  currency: string
  createdAt: string
  order?: {
    orderNumber: string
    title: string
    status: string
  }
}

interface Summary {
  totalPaid: number
  totalRefunded: number
  netPaid: number
}

const money = (amount: number, currency = "INR") => `${currency} ${amount.toFixed(2)}`

const dateText = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export default function TransactionsPage() {
  const { token, isHydrated } = useAuthToken()
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const loadTransactions = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const [txData, summaryData] = await Promise.all([
          apiRequest<TransactionItem[]>("/api/transactions"),
          apiRequest<Summary>("/api/transactions/summary"),
        ])

        if (!mounted) return
        setTransactions(txData)
        setSummary(summaryData)
        setError("")
      } catch (err) {
        if (!mounted) return
        if (err instanceof ApiError) setError(err.message)
        else setError("Unable to load transactions")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadTransactions()
    return () => {
      mounted = false
    }
  }, [token])

  if (!isHydrated) {
    return (
      <AppShell>
        <PageHeader title="Transactions" backHref="/profile" />
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (!token) {
    return (
      <AppShell>
        <PageHeader title="Transactions" backHref="/profile" />
        <div className="mx-auto max-w-lg px-4 py-8 text-center">
          <p className="text-muted-foreground">Login to view your transaction history.</p>
          <Link href="/login" className="mt-3 inline-block font-semibold text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Transactions" backHref="/profile" />
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        {loading ? <div className="h-28 animate-pulse rounded-xl bg-muted" /> : null}

        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!loading && summary ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-bold text-foreground">{money(summary.totalPaid)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Refunded</p>
              <p className="text-lg font-bold text-foreground">{money(summary.totalRefunded)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Net Paid</p>
              <p className="text-lg font-bold text-foreground">{money(summary.netPaid)}</p>
            </div>
          </div>
        ) : null}

        {!loading ? (
          <div className="space-y-3">
            {transactions.length ? (
              transactions.map((tx) => (
                <div key={tx._id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tx.transactionId}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.type.toUpperCase()} | {tx.method} | {dateText(tx.createdAt)}
                      </p>
                      {tx.order ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tx.order.orderNumber} - {tx.order.title}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === "refund" ? "text-warning" : "text-success"}`}>
                        {tx.type === "refund" ? "-" : "+"}
                        {money(tx.amount, tx.currency)}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">{tx.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                No transactions found.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
