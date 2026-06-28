import { Skeleton } from "@/components/ui/skeleton";

export function CatalogPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32 rounded-md bg-emerald-100" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-emerald-100 bg-white"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none bg-emerald-50" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4 rounded-md bg-emerald-100" />
              <Skeleton className="h-7 w-1/3 rounded-md bg-emerald-100" />
              <Skeleton className="h-10 w-full rounded-md bg-emerald-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
