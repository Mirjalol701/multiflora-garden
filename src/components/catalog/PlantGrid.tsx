import type { PlantListItem } from "@/types";
import { PlantCard } from "@/components/catalog/plant-card";
import { Leaf } from "lucide-react";

type PlantGridProps = {
  plants: PlantListItem[];
};

export function PlantGrid({ plants }: PlantGridProps) {
  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white py-20 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
          <Leaf className="h-7 w-7" />
        </span>
        <p className="text-lg font-medium text-emerald-800">Растения не найдены</p>
        <p className="mt-2 max-w-sm text-sm text-stone-600">
          Попробуйте изменить категорию или диапазон цен
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Найдено:{" "}
        <span className="font-semibold text-emerald-800">{plants.length}</span>{" "}
        {plants.length === 1
          ? "растение"
          : plants.length < 5
            ? "растения"
            : "растений"}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {plants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  );
}
