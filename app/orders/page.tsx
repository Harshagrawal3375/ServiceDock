import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { OrdersList } from "@/components/orders/orders-list"

export default function OrdersPage() {
  return (
    <AppShell>
      <PageHeader title="My Orders" />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <OrdersList />
      </div>
    </AppShell>
  )
}
