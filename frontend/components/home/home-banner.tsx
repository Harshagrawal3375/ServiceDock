"use client"

import Link from "next/link"
import { ArrowRight, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-6">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="h-5 w-5 text-primary-foreground" />
          <span className="text-primary-foreground/90 text-sm font-medium">Fast Delivery</span>
        </div>
        <h2 className="text-xl font-bold text-primary-foreground mb-2 text-balance">
          Get your work done before deadline
        </h2>
        <p className="text-primary-foreground/80 text-sm mb-4">
          Quality academic assistance at affordable prices
        </p>
        <Button 
          asChild
          variant="secondary" 
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <Link href="/create-order">
            Place Order
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  )
}
