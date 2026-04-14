import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StoreGrid } from "@/components/store/store-grid"
import { StoreCategories } from "@/components/store/store-categories"

export default function StorePage() {
  return (
    <AppShell>
      <PageHeader title="Digital Store" backHref="/" />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <StoreCategories />
        <StoreGrid />
      </div>
    </AppShell>
  )
}
