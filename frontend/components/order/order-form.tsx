"use client"

import { useState, useCallback, FormEvent, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Upload, Calendar, FileText, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { apiRequest, ApiError } from "@/lib/api"
import { getAuthToken } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"

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

const defaultServices: ServiceSettings = {
  assignment: { label: "Assignment Help", basePrice: 299 },
  task: { label: "Task Help", basePrice: 249 },
  ppt: { label: "PPT Making", basePrice: 199 },
  resume: { label: "Resume Builder", basePrice: 149 },
  project: { label: "Mini Project", basePrice: 499 },
  other: { label: "Other Academic Help", basePrice: 199 },
}

const defaultUrgency: UrgencySettings = {
  normal: { label: "Normal (5-7 days)", multiplier: 1 },
  urgent: { label: "Urgent (2-3 days)", multiplier: 1.5 },
  express: { label: "Express (24 hours)", multiplier: 2 },
}

interface CreatedOrder {
  _id: string
}

export function OrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialService = searchParams.get("service") || ""

  const [service, setService] = useState(initialService)
  const [urgency, setUrgency] = useState("normal")
  const [subject, setSubject] = useState("")
  const [instructions, setInstructions] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [services, setServices] = useState<ServiceSettings>(defaultServices)
  const [urgencyOpts, setUrgencyOpts] = useState<UrgencySettings>(defaultUrgency)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    apiRequest<SettingsData>("/api/settings")
      .then((data) => {
        setServices(data.services)
        setUrgencyOpts(data.urgency)
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true))
  }, [])

  const calculatePrice = useCallback(() => {
    const selectedService = services[service]
    const selectedUrgency = urgencyOpts[urgency]

    if (!selectedService || !selectedUrgency) return 0
    return Math.round(selectedService.basePrice * selectedUrgency.multiplier)
  }, [service, urgency, services, urgencyOpts])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError("")

    const token = getAuthToken()
    if (!token) {
      router.push("/login")
      return
    }

    const price = calculatePrice()
    if (!price || !service || !subject) {
      setSubmitError("Please complete service, subject, and price details")
      return
    }

    router.push(`/pay/create?price=${price}&service=${service}&subject=${encodeURIComponent(subject)}&urgency=${urgency}&instructions=${encodeURIComponent(instructions)}`)
  }

  const handleProceedToPayment = () => {
    const price = calculatePrice()
    if (!price || !service || !subject) {
      setSubmitError("Please complete all details")
      return
    }
    const params = new URLSearchParams({
      price: price.toString(),
      service,
      subject,
      urgency,
      instructions,
    })
    router.push(`/pay/create?${params.toString()}`)
  }

  const price = calculatePrice()

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="service">Service Type</Label>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger id="service" className="h-12">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(services).map(([key, type]) => (
              <SelectItem key={key} value={key}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Upload Files</Label>
        <div
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Drag & drop files here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
          </div>
        </div>

        {files.length > 0 ? (
          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate text-sm">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject Name</Label>
        <Input
          id="subject"
          placeholder="e.g., Data Structures, Marketing"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Add any specific requirements or guidelines..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="urgency" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Deadline
        </Label>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger id="urgency" className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(urgencyOpts).map(([key, option]) => (
              <SelectItem key={key} value={key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="mb-1 text-sm text-muted-foreground">Estimated Price</p>
            <p className="text-2xl font-bold text-foreground">
              {price > 0 ? `Rs. ${price}` : "Select service"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This amount is used for initial payment and transaction tracking.
            </p>
          </div>
        </div>
      </div>

      {submitError ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      {submitSuccess ? (
        <p className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
          {submitSuccess}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full bg-gradient-to-r from-primary to-accent text-base font-semibold transition-opacity hover:opacity-90"
        disabled={!service || !subject || isSubmitting}
      >
        {isSubmitting ? "Placing Order..." : "Place Order"}
      </Button>
    </form>
  )
}
