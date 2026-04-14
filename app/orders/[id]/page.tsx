import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { OrderDetail } from "@/components/orders/order-detail"

interface OrderDetailPageProps {
  params: { id: string }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params
  
  return (
    <AppShell>
      <PageHeader title={`Order ${id}`} backHref="/orders" />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <OrderDetail orderId={id} />
      </div>
    </AppShell>
  )
}
