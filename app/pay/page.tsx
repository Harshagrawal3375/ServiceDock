"use client"

import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import QRCode from "qrcode"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthToken } from "@/hooks/use-auth-token"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface OrderData {
  _id: string
  orderNumber: string
  title: string
  pricing: {
    quotedPrice: number
    finalPrice: number
  }
  payment: {
    status: string
    amountPaid: number
    pendingPayment?: {
      method: string
      transactionRef: string
      amount: number
      submittedAt: string
    }
  }
}

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "yourname@oksbi"
const MERCHANT_NAME = process.env.NEXT_PUBLIC_MERCHANT_NAME || "Student Helper"

const generateUPIQR = (amount: number, note: string) => {
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&tn=${encodeURIComponent(note)}`
  return upiLink
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/script.js"
    script.onload = () => resolve(true)
    document.body.appendChild(script)
  })
}

function PayContent() {
  const router = useRouter()
  const { token, isHydrated } = useAuthToken()
  const orderId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("orderId") : null

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  const [offlineMethod, setOfflineMethod] = useState("upi")
  const [transactionRef, setTransactionRef] = useState("")
  const [offlineAmount, setOfflineAmount] = useState("")
  const [showQR, setShowQR] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  useEffect(() => {
    let mounted = true

    const loadOrder = async () => {
      if (!token || !orderId) {
        setLoading(false)
        return
      }

      try {
        const data = await apiRequest<OrderData>(`/api/orders/${orderId}`)
        if (!mounted) return
        setOrder(data)
        setOfflineAmount(data.pricing.finalPrice.toString())
        setError("")
      } catch (err) {
        if (!mounted) return
        if (err instanceof ApiError) setError(err.message)
        else setError("Unable to load order")
      } finally {
        if (!mounted) setLoading(false)
      }
    }

    loadOrder()
    return () => {
      mounted = false
    }
  }, [token, orderId])

  const handleOnlinePayment = async () => {
    if (!order || !token) return

    setProcessing(true)
    setError("")

    try {
      await loadRazorpayScript()

      const { orderId: rzOrderId, amount } = await apiRequest<{ orderId: string; amount: number; currency: string }>("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ orderId: order._id, amount: order.pricing.finalPrice }),
      })

      const rzOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "your_key_id",
        order_id: rzOrderId,
        amount: amount,
        currency: "INR",
        name: "Student Helper",
        description: `Payment for ${order.orderNumber}`,
        handler: async (response: any) => {
          try {
            const result = await apiRequest("/api/payment/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              }),
            })

            if (result.success) {
              router.push(`/orders/${order._id}?payment=success`)
            }
          } catch (err) {
            setError("Payment verification failed")
            setProcessing(false)
          }
        },
        prefill: {
          name: "Student User",
          email: "user@example.com",
        },
        theme: {
          color: "#4F46E5",
        },
      }

      const rzp = new window.Razorpay(rzOptions)
      rzp.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`)
        setProcessing(false)
      })
      rzp.open()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Unable to initiate payment")
      setProcessing(false)
    }
  }

  const handleOfflineSubmit = async () => {
    if (!order || !token || !transactionRef || !offlineAmount) return

    setProcessing(true)
    setError("")
    setSuccess("")

    try {
      const result = await apiRequest("/api/payment/offline", {
        method: "POST",
        body: JSON.stringify({
          orderId: order._id,
          method: offlineMethod,
          transactionRef: transactionRef,
          amount: Number(offlineAmount),
        }),
      })

      setSuccess(result.message)
      setShowOfflineForm(false)
      setTransactionRef("")
      router.push(`/orders/${order._id}?payment=pending`)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Unable to submit payment")
    } finally {
      setProcessing(false)
    }
  }

  const openUPIApp = () => {
    if (!order) return
    const amount = order.pricing.finalPrice
    const note = `Order ${order.orderNumber}`
    const upiLink = generateUPIQR(amount, note)
    window.location.href = upiLink
  }

  const generateQR = async () => {
    if (!order || !UPI_ID || UPI_ID === "yourname@oksbi") {
      setError("UPI ID not configured")
      return
    }
    try {
      const upiLink = generateUPIQR(order.pricing.finalPrice, `Order ${order.orderNumber}`)
      const qrDataUrl = await QRCode.toDataURL(upiLink, {
        width: 250,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
      setQrCodeUrl(qrDataUrl)
      setShowQR(true)
      setError("")
    } catch (err) {
      setError("Unable to generate QR code")
    }
  }

  if (!isHydrated) {
    return (
      <AppShell>
        <PageHeader title="Payment" backHref="/orders" />
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (!token || !orderId) {
    return (
      <AppShell>
        <PageHeader title="Payment" backHref="/orders" />
        <div className="mx-auto max-w-lg px-4 py-8 text-center">
          <p className="text-muted-foreground">Please login to make payment.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Payment" backHref={`/orders/${orderId}`} />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        ) : error && !order ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        ) : order ? (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="text-lg font-semibold">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{order.title}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-bold">₹{order.pricing.finalPrice.toFixed(2)}</p>
              {order.payment.amountPaid > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Already paid: ₹{order.payment.amountPaid.toFixed(2)}</p>
              )}
            </div>

            {order.payment.pendingPayment ? (
              <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
                <p className="font-semibold text-warning">Payment Pending Verification</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Method: {order.payment.pendingPayment.method} | Ref: {order.payment.pendingPayment.transactionRef}
                </p>
              </div>
            ) : order.payment.status === "paid" ? (
              <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-center text-success">
                <p className="font-semibold">Payment Already Completed</p>
              </div>
            ) : showOfflineForm ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <p className="font-semibold">Offline Payment Details</p>

                <div>
                  <label className="text-xs text-muted-foreground">Payment Method</label>
                  <select
                    value={offlineMethod}
                    onChange={(e) => setOfflineMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="upi">UPI Transfer</option>
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="cash">Cash Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Transaction Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="UTR Number / Transaction ID"
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    value={offlineAmount}
                    onChange={(e) => setOfflineAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <button
                  onClick={handleOfflineSubmit}
                  disabled={processing || !transactionRef || !offlineAmount}
                  className="w-full rounded-xl bg-success px-4 py-3 font-semibold text-success-foreground disabled:opacity-50"
                >
                  {processing ? "Submitting..." : "Submit Payment Proof"}
                </button>

                <button
                  onClick={() => setShowOfflineForm(false)}
                  className="w-full rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={openUPIApp}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#6739b7] px-3 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    </svg>
                    UPI App
                  </button>

                  <button
                    onClick={generateQR}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#6739b7] px-3 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="3" height="3" />
                      <rect x="18" y="14" width="3" height="3" />
                      <rect x="14" y="18" width="3" height="3" />
                      <rect x="18" y="18" width="3" height="3" />
                    </svg>
                    QR Code
                  </button>
                </div>

                <button
                  onClick={handleOnlinePayment}
                  disabled={processing}
                  className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Pay Online (Razorpay)"}
                </button>

                <button
                  onClick={() => {
                    setShowOfflineForm(true)
                    setError("")
                    setSuccess("")
                  }}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 font-semibold text-foreground hover:bg-muted"
                >
                  Manual Transfer (UTR)
                </button>
              </div>
            )}

            {success && <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">{success}</div>}
            {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

            <Dialog open={showQR} onOpenChange={setShowQR}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Scan & Pay</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4 py-4">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="UPI QR Code" className="rounded-lg border" />
                  ) : (
                    <div className="h-[250px] w-[250px] animate-pulse rounded-lg bg-muted" />
                  )}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                    <p className="font-semibold">₹{order?.pricing.finalPrice.toFixed(2)}</p>
                  </div>
                  <div className="w-full space-y-2">
                    <Label className="text-xs text-muted-foreground">UPI ID</Label>
                    <Input value={UPI_ID} readOnly className="text-center font-mono text-sm" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

function PayLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={<PayLoading />}>
      <PayContent />
    </Suspense>
  )
}