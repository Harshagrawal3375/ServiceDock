import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileStats } from "@/components/profile/profile-stats"
import { ProfileMenu } from "@/components/profile/profile-menu"

export default function ProfilePage() {
  return (
    <AppShell>
      <PageHeader title="Profile" backHref="/" />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <ProfileHeader />
        <ProfileStats />
        <ProfileMenu />
      </div>
    </AppShell>
  )
}
