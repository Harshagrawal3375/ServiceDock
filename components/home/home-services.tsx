"use client"

import { 
  FileText, 
  Presentation, 
  BookOpen, 
  FileUser, 
  Lightbulb 
} from "lucide-react"
import { ServiceCard } from "@/components/service-card"

const services = [
  {
    title: "Assignment Help",
    description: "Get expert assistance",
    icon: FileText,
    href: "/create-order?service=assignment",
  },
  {
    title: "PPT Making",
    description: "Professional slides",
    icon: Presentation,
    href: "/create-order?service=ppt",
  },
  {
    title: "Notes & PYQs",
    description: "Study materials",
    icon: BookOpen,
    href: "/store",
  },
  {
    title: "Resume Builder",
    description: "Stand out from crowd",
    icon: FileUser,
    href: "/create-order?service=resume",
  },
  {
    title: "Mini Projects",
    description: "Complete solutions",
    icon: Lightbulb,
    href: "/create-order?service=project",
  },
]

export function HomeServices() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Our Services</h2>
        <button className="text-sm text-primary font-medium hover:underline">
          View all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {services.slice(0, 4).map((service) => (
          <ServiceCard key={service.title} {...service} />
        ))}
      </div>
      <div className="mt-3 md:max-w-sm">
        <ServiceCard {...services[4]} gradient />
      </div>
    </section>
  )
}
