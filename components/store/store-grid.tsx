"use client"

import { FileText, Presentation, FileUser, BookOpen, Star, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const products = [
  {
    id: "1",
    title: "Complete DSA Notes",
    category: "Notes",
    price: 99,
    originalPrice: 199,
    rating: 4.8,
    reviews: 124,
    icon: FileText,
    popular: true,
  },
  {
    id: "2",
    title: "Marketing PPT Pack",
    category: "PPT Templates",
    price: 149,
    originalPrice: 299,
    rating: 4.6,
    reviews: 89,
    icon: Presentation,
    popular: false,
  },
  {
    id: "3",
    title: "Professional Resume",
    category: "Resume",
    price: 79,
    originalPrice: 149,
    rating: 4.9,
    reviews: 256,
    icon: FileUser,
    popular: true,
  },
  {
    id: "4",
    title: "DBMS PYQ Collection",
    category: "PYQs",
    price: 49,
    originalPrice: 99,
    rating: 4.7,
    reviews: 67,
    icon: BookOpen,
    popular: false,
  },
  {
    id: "5",
    title: "OS Complete Notes",
    category: "Notes",
    price: 89,
    originalPrice: 179,
    rating: 4.5,
    reviews: 103,
    icon: FileText,
    popular: false,
  },
  {
    id: "6",
    title: "Business PPT Templates",
    category: "PPT Templates",
    price: 129,
    originalPrice: 249,
    rating: 4.8,
    reviews: 145,
    icon: Presentation,
    popular: true,
  },
]

export function StoreGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="group rounded-xl bg-card border border-border p-4 transition-all hover:shadow-md hover:border-primary/30"
        >
          {/* Icon and Badge */}
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <product.icon className="h-6 w-6 text-primary" />
            </div>
            {product.popular && (
              <Badge className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] px-1.5">
                Popular
              </Badge>
            )}
          </div>

          {/* Content */}
          <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-2">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-foreground">Rs. {product.price}</span>
            <span className="text-xs text-muted-foreground line-through">
              Rs. {product.originalPrice}
            </span>
          </div>

          {/* Buy Button */}
          <Button 
            size="sm" 
            className="w-full h-9 text-xs bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Buy Now
          </Button>
        </div>
      ))}
    </div>
  )
}
