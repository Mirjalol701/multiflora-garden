import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ServicesSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-8 h-10 w-48" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-16">
      <Skeleton className="h-[420px] w-full" />
      <div className="container mx-auto grid gap-6 px-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
