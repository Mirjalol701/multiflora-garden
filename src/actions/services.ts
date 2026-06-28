"use server";

import { prisma } from "@/lib/prisma";
import { serviceFilterSchema } from "@/lib/validations";
import type { PaginatedResult, ServiceListItem } from "@/types";
import type { Prisma } from "@prisma/client";

const SERVICE_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
} satisfies Prisma.ServiceSelect;

export async function getServices(
  rawParams: Record<string, string | string[] | undefined> = {}
): Promise<PaginatedResult<ServiceListItem>> {
  try {
    const params = Object.fromEntries(
      Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
    );

    const parsed = serviceFilterSchema.safeParse(params);
    const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 6 };

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        select: SERVICE_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.service.count(),
    ]);

    return {
      items: services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch {
    return { items: [], total: 0, page: 1, limit: 6, totalPages: 0 };
  }
}

export async function getFeaturedServices(limit = 3): Promise<ServiceListItem[]> {
  try {
    return await prisma.service.findMany({
      select: SERVICE_SELECT,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}
