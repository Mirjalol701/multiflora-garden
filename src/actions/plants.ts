"use server";

import { prisma } from "@/lib/prisma";
import type { PlantListItem } from "@/types";
import type { Prisma } from "@prisma/client";

export type PlantFilters = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

const PLANT_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  category: true,
  stock: true,
} satisfies Prisma.PlantSelect;

function buildWhere(filters: PlantFilters): Prisma.PlantWhereInput {
  const where: Prisma.PlantWhereInput = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  return where;
}

export async function getFilteredPlants(
  filters: PlantFilters = {}
): Promise<PlantListItem[]> {
  return prisma.plant.findMany({
    where: buildWhere(filters),
    select: PLANT_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlantCategories(): Promise<string[]> {
  const result = await prisma.plant.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return result.map((r) => r.category);
}

export async function getFeaturedPlants(limit = 4): Promise<PlantListItem[]> {
  return prisma.plant.findMany({
    where: { stock: { gt: 0 } },
    select: PLANT_SELECT,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const result = await prisma.plant.aggregate({
    _min: { price: true },
    _max: { price: true },
  });

  return {
    min: result._min.price ?? 0,
    max: result._max.price ?? 10000,
  };
}
