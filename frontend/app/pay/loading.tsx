import { Skeleton } from "@/components/ui/skeleton"

export default function PayLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}