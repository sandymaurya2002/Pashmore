import { ProductGridSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className="container-luxe pb-24 pt-12">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-5 h-12 w-2/3 max-w-lg" />
      <div className="mt-12">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  )
}
