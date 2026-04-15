import { Suspense, use } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { OrderDetail } from "@/components/orders/order-detail"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

function OrderDetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params)
  
  return (
    <AppShell>
      <PageHeader title={`Order ${id}`} backHref="/orders" />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Suspense fallback={<OrderDetailLoading />}>
          <OrderDetail orderId={id} />
        </Suspense>
      </div>
    </AppShell>
  )
}
