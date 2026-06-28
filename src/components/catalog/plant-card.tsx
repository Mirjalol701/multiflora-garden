import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { PlantListItem } from "@/types";

type PlantCardProps = {
  plant: PlantListItem;
};

export function PlantCard({ plant }: PlantCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
        <Image
          src={plant.imageUrl}
          alt={plant.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur-sm">
          {plant.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-lg font-semibold text-stone-800 transition-colors duration-200 group-hover:text-emerald-800">
          {plant.name}
        </h3>
        <p className="mt-3 text-xl font-bold text-emerald-800">
          {formatPrice(plant.price)}
        </p>

        <div className="mt-auto pt-5">
          <Button
            asChild
            variant="outline"
            className="w-full border-emerald-200 text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 hover:text-emerald-900"
          >
            <Link href="/catalog">
              Подробнее
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
