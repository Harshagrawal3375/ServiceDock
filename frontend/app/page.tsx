import { AppShell } from "@/components/app-shell"
import { HomeHeader } from "@/components/home/home-header"
import { HomeSearch } from "@/components/home/home-search"
import { HomeServices } from "@/components/home/home-services"
import { HomeBanner } from "@/components/home/home-banner"
import { HomeQuickActions } from "@/components/home/home-quick-actions"
import { FloatingOrderButton } from "@/components/floating-order-button"

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <HomeHeader />
        <div className="mx-auto flex-1 w-full max-w-6xl space-y-6 px-4 py-6">
          <HomeSearch />
          <HomeBanner />
          <HomeServices />
          <HomeQuickActions />
        </div>
      </div>
      <FloatingOrderButton />
    </AppShell>
  )
}
