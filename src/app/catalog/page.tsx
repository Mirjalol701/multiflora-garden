import { Suspense } from "react";
import type { Metadata } from "next";
import { getFilteredPlants, getPriceRange } from "@/actions/plants";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { PlantGrid } from "@/components/catalog/PlantGrid";
import { CatalogPageSkeleton } from "@/components/catalog/catalog-skeleton";

export const metadata: Metadata = {
  title: "Каталог растений",
  description:
    "Каталог садовых растений MultiFlora Garden. Фильтрация по категориям и цене. Доставка по Москве.",
};

export const revalidate = 30;

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CatalogResults({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const flatParams = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );

  const filters = {
    category: flatParams.category,
    minPrice: flatParams.minPrice ? Number(flatParams.minPrice) : undefined,
    maxPrice: flatParams.maxPrice ? Number(flatParams.maxPrice) : undefined,
  };

  const plants = await getFilteredPlants(filters);

  return <PlantGrid plants={plants} />;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;
  const priceRange = await getPriceRange();

  const flatParams = Object.fromEntries(
    Object.entries(resolvedParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-emerald-800 sm:text-4xl">
          Каталог растений
        </h1>
        <p className="mt-2 text-stone-600">
          Выберите идеальное растение для вашего сада или участка
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-emerald-50" />}>
          <CatalogFilters
            priceRange={priceRange}
            currentCategory={flatParams.category}
            currentMinPrice={flatParams.minPrice}
            currentMaxPrice={flatParams.maxPrice}
          />
        </Suspense>

        <Suspense
          key={JSON.stringify(flatParams)}
          fallback={<CatalogPageSkeleton />}
        >
          <CatalogResults searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  );
}
