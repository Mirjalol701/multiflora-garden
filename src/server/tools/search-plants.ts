import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ZyronTool } from "./types";

/**
 * Gives the AI gardener live read access to the nursery catalog so it can
 * recommend real, in-stock plants (with prices) instead of generic advice.
 */
export const searchPlantsTool: ZyronTool = {
  name: "search_plants",
  schema: {
    name: "search_plants",
    description:
      "Search the garden center's real plant catalog (name, category, price, stock). " +
      "Use this whenever the user asks what to plant, for recommendations, prices, " +
      "availability, or garden planning — always recommend real catalog plants.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Free-text search over plant name and description (e.g. 'evergreen conifer', 'хвойное').",
        },
        category: {
          type: "string",
          description: "Filter by exact category if known.",
        },
        maxPrice: {
          type: "number",
          description: "Only return plants at or below this price.",
        },
        inStockOnly: {
          type: "boolean",
          description: "If true, only return plants currently in stock.",
        },
        limit: {
          type: "number",
          description: "Max plants to return (default 8, max 20).",
        },
      },
    },
  },

  async execute(args) {
    const query = String(args.query ?? "").trim();
    const category = String(args.category ?? "").trim();
    const maxPrice =
      typeof args.maxPrice === "number" && args.maxPrice > 0
        ? args.maxPrice
        : undefined;
    const inStockOnly = args.inStockOnly === true;
    const limit = Math.min(
      Math.max(Number(args.limit) || 8, 1),
      20
    );

    const where: Prisma.PlantWhereInput = {};
    if (category) where.category = category;
    if (maxPrice !== undefined) where.price = { lte: maxPrice };
    if (inStockOnly) where.stock = { gt: 0 };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];
    }

    const plants = await prisma.plant.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        stock: true,
      },
      orderBy: { price: "asc" },
      take: limit,
    });

    return {
      count: plants.length,
      plants: plants.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        inStock: p.stock > 0,
        description: p.description.slice(0, 200),
      })),
    };
  },

  summarize(result) {
    const count = (result as { count?: number }).count ?? 0;
    return `Found ${count} catalog plant(s)`;
  },
};
