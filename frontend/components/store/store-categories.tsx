"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "ppt", label: "PPT Templates" },
  { id: "resume", label: "Resume" },
  { id: "pyq", label: "PYQs" },
]

export function StoreCategories() {
  const [activeCategory, setActiveCategory] = useState("all")

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            activeCategory === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
