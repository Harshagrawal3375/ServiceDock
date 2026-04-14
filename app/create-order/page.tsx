"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { OrderForm } from "@/components/order/order-form"
import { PageHeader } from "@/components/page-header"

export default function CreateOrderPage() {
  return (
    <AppShell>
      <PageHeader title="Create Order" backHref="/" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-xl" />}>
          <OrderForm />
        </Suspense>
      </div>
    </AppShell>
  )
}
