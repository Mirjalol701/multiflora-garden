import { CatalogPageSkeleton } from "@/components/catalog/catalog-skeleton";

export default function CatalogLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 space-y-3">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-emerald-100" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-md bg-emerald-50" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5">
          <div className="h-5 w-24 animate-pulse rounded-md bg-emerald-100" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-emerald-50"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-10 animate-pulse rounded-md bg-emerald-50" />
            <div className="h-10 animate-pulse rounded-md bg-emerald-50" />
          </div>
        </div>

        <CatalogPageSkeleton />
      </div>
    </div>
  );
}
