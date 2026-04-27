"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthToken } from "@/hooks/use-auth-token"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface CreatedOrder {
  _id: string
  orderNumber: string
}

const UPI_ID =
  typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_UPI_ID || "yourname@oksbi") : "yourname@oksbi"
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

export default function PayCreatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token, isHydrated } = useAuthToken()

  const price = Number(searchParams.get("price")) || 0
  const service = searchParams.get("service") || ""
  const subject = searchParams.get("subject") || ""
  const urgency = searchParams.get("urgency") || "normal"
  const instructions = searchParams.get("instructions") || ""

  const [order, setOrder] = useState<CreatedOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  const [offlineMethod, setOfflineMethod] = useState("upi")
  const [transactionRef, setTransactionRef] = useState("")
  const [offlineAmount, setOfflineAmount] = useState(price.toString())
  const [showQR, setShowQR] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [orderCreated, setOrderCreated] = useState(false)

  useEffect(() => {
    if (!isHydrated || !token) return
    if (orderCreated) return

    const createOrderAndPay = async () => {
      setLoading(true)
      try {
        const createdOrder = await apiRequest<CreatedOrder>("/api/orders", {
          method: "POST",
          body: {
            title: `${subject} - ${service}`,
            serviceType: service,
            subject,
            instructions,
            urgency,
            quotedPrice: price,
            finalPrice: price,
            amountPaid: 0,
          },
        })
        setOrder(createdOrder)
        setOrderCreated(true)
      } catch (err) {
        if (err instanceof ApiError) setError(err.message)
        else setError("Unable to create order")
      } finally {
        setLoading(false)
      }
    }

    if (price > 0 && service && subject) {
      createOrderAndPay()
    }
  }, [isHydrated, token, price, service, subject, urgency, instructions, orderCreated])

  const handleOnlinePayment = async () => {
    if (!order || !token) return

    setProcessing(true)
    setError("")

    try {
      await loadRazorpayScript()

      const { orderId: rzOrderId, amount } = await apiRequest<{ orderId: string; amount: number }>("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify({ orderId: order._id, amount: price }),
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
        prefill: { name: "Student User", email: "user@example.com" },
        theme: { color: "#4F46E5" },
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
    const upiLink = generateUPIQR(price, `Order ${order.orderNumber}`)
    window.location.href = upiLink
  }

  const generateQR = async () => {
    if (!order || !UPI_ID || UPI_ID === "yourname@oksbi") {
      setError("UPI ID not configured")
      return
    }
    try {
      const upiLink = generateUPIQR(price, `Order ${order.orderNumber}`)
      const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 250, margin: 2 })
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
        <PageHeader title="Payment" />
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (!token) {
    return (
      <AppShell>
        <PageHeader title="Payment" />
        <div className="mx-auto max-w-lg px-4 py-8 text-center">
          <p className="text-muted-foreground">Please login to make payment.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Complete Payment" backHref="/create-order" />
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
              <p className="text-sm text-muted-foreground">{subject} - {service}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-bold">₹{price.toFixed(2)}</p>
            </div>

            {showOfflineForm ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <p className="font-semibold">Offline Payment Details</p>
                <div>
                  <label className="text-xs text-muted-foreground">Payment Method</label>
                  <select
                    value={offlineMethod}
                    onChange={(e) => setOfflineMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="upi">UPI Transfer</option>
                    <option value="bank-transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Transaction Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="UTR Number"
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button className="w-full" onClick={handleOfflineSubmit} disabled={processing || !transactionRef}>
                  {processing ? "Submitting..." : "Submit Payment Proof"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowOfflineForm(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={openUPIApp} disabled={processing} className="bg-[#6739b7]">
                    UPI App
                  </Button>
                  <Button onClick={generateQR} disabled={processing} className="bg-[#6739b7]">
                    QR Code
                  </Button>
                </div>
                <Button onClick={handleOnlinePayment} disabled={processing} className="w-full">
                  {processing ? "Processing..." : "Pay Online (Razorpay)"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowOfflineForm(true)}>
                  Manual Transfer (UTR)
                </Button>
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
                    <p className="font-semibold">₹{price.toFixed(2)}</p>
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
