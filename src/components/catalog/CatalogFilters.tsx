"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const CATEGORY_FILTERS = [
  { label: "Хвойные", value: "Хвойные" },
  { label: "Лиственные", value: "Кустарники" },
  { label: "Цветы", value: "Цветущие" },
] as const;

type CatalogFiltersProps = {
  priceRange: { min: number; max: number };
  currentCategory?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
};

export function CatalogFilters({
  priceRange,
  currentCategory,
  currentMinPrice,
  currentMaxPrice,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const handleCategoryClick = (value: string | null) => {
    updateParams({ category: value });
  };

  const resetFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const hasActiveFilters =
    !!currentCategory || !!currentMinPrice || !!currentMaxPrice;

  return (
    <aside
      className={cn(
        "space-y-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-opacity duration-300",
        isPending && "opacity-60"
      )}
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-emerald-800">
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
        </div>
        {isPending && (
          <span className="text-xs text-stone-500">Обновление…</span>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-stone-700">Категория</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={!currentCategory ? "default" : "outline"}
            onClick={() => handleCategoryClick(null)}
            className={cn(
              "rounded-full transition-all duration-200",
              !currentCategory
                ? "bg-emerald-800 hover:bg-emerald-900"
                : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            )}
          >
            Все
          </Button>
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = currentCategory === cat.value;
            return (
              <Button
                key={cat.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => handleCategoryClick(cat.value)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  isActive
                    ? "bg-emerald-800 hover:bg-emerald-900"
                    : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                )}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minPrice" className="text-stone-700">
            Цена от, ₽
          </Label>
          <Input
            id="minPrice"
            type="number"
            min={priceRange.min}
            max={priceRange.max}
            placeholder={String(priceRange.min)}
            defaultValue={currentMinPrice ?? ""}
            disabled={isPending}
            className="border-emerald-100"
            onBlur={(e) => updateParams({ minPrice: e.target.value || null })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice" className="text-stone-700">
            Цена до, ₽
          </Label>
          <Input
            id="maxPrice"
            type="number"
            min={priceRange.min}
            max={priceRange.max}
            placeholder={String(priceRange.max)}
            defaultValue={currentMaxPrice ?? ""}
            disabled={isPending}
            className="border-emerald-100"
            onBlur={(e) => updateParams({ maxPrice: e.target.value || null })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          onClick={resetFilters}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          Сбросить фильтры
        </Button>
      )}
    </aside>
  );
}
