import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat(siteConfig.locale.lang, {
    style: "currency",
    currency: siteConfig.locale.currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export const CALLBACK_STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершён",
};
