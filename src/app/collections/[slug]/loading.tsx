import { ProductGridSkeleton, Skeleton } from '@/components/ui/skeleton'

export default function CollectionLoading() {
  return (
    <>
      <Skeleton className="h-[38dvh] min-h-64 w-full md:h-[46dvh]" />

      <div className="container-luxe">
        <div className="max-w-3xl py-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-4/5" />
        </div>

        <div className="flex gap-12 pb-24">
          <div className="hidden w-64 shrink-0 flex-col gap-6 lg:flex">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between border-b border-line pb-5">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-40" />
            </div>
            <div className="mt-10">
              <ProductGridSkeleton count={8} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
