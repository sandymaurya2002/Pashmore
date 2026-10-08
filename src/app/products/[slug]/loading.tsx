import { Skeleton } from '@/components/ui/skeleton'

export default function ProductLoading() {
  return (
    <div className="container-luxe grid gap-12 pb-20 pt-12 lg:grid-cols-2 lg:gap-16">
      <div className="flex gap-5">
        <div className="hidden w-20 shrink-0 flex-col gap-3 lg:flex">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="aspect-4/5 w-full" />
          ))}
        </div>
        <Skeleton className="aspect-4/5 min-w-0 flex-1" />
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-4 h-7 w-32" />
        <Skeleton className="mt-6 h-10 w-48" />
        <Skeleton className="mt-2 h-10 w-56" />
        <Skeleton className="mt-6 h-13 w-full" />
        <Skeleton className="h-13 w-full" />
      </div>
    </div>
  )
}
