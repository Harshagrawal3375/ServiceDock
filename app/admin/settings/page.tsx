"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { apiRequest, ApiError } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ServiceSettings {
  [key: string]: {
    label: string
    basePrice: number
  }
}

interface UrgencySettings {
  [key: string]: {
    label: string
    multiplier: number
  }
}

interface SettingsData {
  services: ServiceSettings
  urgency: UrgencySettings
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, isHydrated } = useAuthUser()
  const [services, setServices] = useState<ServiceSettings>({})
  const [urgency, setUrgency] = useState<UrgencySettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingUsers, setDeletingUsers] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (isHydrated && user?.role !== "admin") {
      router.push("/")
    }
  }, [user, isHydrated, router])

  useEffect(() => {
    if (!user || user.role !== "admin") return

    const loadSettings = async () => {
      try {
        const data = await apiRequest<SettingsData>("/api/settings")
        setServices(data.services)
        setUrgency(data.urgency)
      } catch (err) {
        if (err instanceof ApiError) setError(err.message)
        else setError("Unable to load settings")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user])

  const updateServicePrice = (key: string, value: string) => {
    const price = Number(value) || 0
    setServices((prev) => ({
      ...prev,
      [key]: { ...prev[key], basePrice: price },
    }))
  }

  const updateUrgencyMultiplier = (key: string, value: string) => {
    const multiplier = Number(value) || 1
    setUrgency((prev) => ({
      ...prev,
      [key]: { ...prev[key], multiplier },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      await apiRequest("/api/settings", {
        method: "POST",
        body: { services, urgency },
      })
      setSuccess("Settings saved successfully!")
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Unable to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrders = async () => {
    if (!confirm("Delete all orders? This cannot be undone!")) return
    setDeleting(true)
    setError("")
    setSuccess("")

    try {
      await apiRequest("/api/admin/orders", { method: "DELETE" })
      setSuccess("All orders deleted!")
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Unable to delete orders")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteUsers = async () => {
    if (!confirm("Delete all client users? This cannot be undone!")) return
    setDeletingUsers(true)
    setError("")
    setSuccess("")

    try {
      await apiRequest("/api/admin/users", { method: "DELETE" })
      setSuccess("All client users deleted!")
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Unable to delete users")
    } finally {
      setDeletingUsers(false)
    }
  }

  if (!isHydrated || user?.role !== "admin") {
    return (
      <AppShell>
        <PageHeader title="Admin Settings" />
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader title="Service Pricing" backHref="/dashboard" />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Prices (Base)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(services).map(([key, service]) => (
              <div key={key} className="grid grid-cols-2 items-center gap-4">
                <Label>{service.label}</Label>
                <Input
                  type="number"
                  value={service.basePrice}
                  onChange={(e) => updateServicePrice(key, e.target.value)}
                  min={0}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Urgency Multipliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(urgency).map(([key, opt]) => (
              <div key={key} className="grid grid-cols-2 items-center gap-4">
                <Label>{opt.label}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={opt.multiplier}
                  onChange={(e) => updateUrgencyMultiplier(key, e.target.value)}
                  min={1}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success">{success}</p>
        )}

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Delete all client users (keep admin)</p>
              <Button variant="destructive" onClick={handleDeleteUsers} disabled={deletingUsers}>
                {deletingUsers ? "Deleting..." : "Delete All Clients"}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Delete all orders</p>
              <Button variant="destructive" onClick={handleDeleteOrders} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete All Orders"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}