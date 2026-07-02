/**
 * ============================================================================
 *  WHITE-LABEL BRAND CONFIG  —  единая точка перебрендирования.
 * ----------------------------------------------------------------------------
 *  RU: Чтобы перепродать/переоформить сайт под другой садовый центр —
 *      измените значения ТОЛЬКО в этом файле (и замените логотип в /public).
 *  EN: To rebrand this site for another garden center, edit values in THIS
 *      file only (and replace the logo in /public). No other code changes.
 *
 *  Ключевые поля можно переопределить через переменные окружения
 *  (NEXT_PUBLIC_*), не трогая код — удобно для деплоя на Vercel под клиента.
 * ============================================================================
 */

function env(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export type NavLink = { href: string; label: string };

export type SiteFeature = {
  /** lucide-react icon name, resolved where rendered */
  icon: "ShieldCheck" | "Sprout" | "Palette" | "Truck" | "Leaf";
  title: string;
  description: string;
};

export const siteConfig = {
  /** Brand / бренд ------------------------------------------------------- */
  brand: {
    name: env("NEXT_PUBLIC_BRAND_NAME", "MultiFlora Garden"),
    shortName: env("NEXT_PUBLIC_BRAND_SHORT_NAME", "MultiFlora"),
    tagline: env("NEXT_PUBLIC_BRAND_TAGLINE", "Питомник & ландшафт"),
    establishedYear: env("NEXT_PUBLIC_BRAND_YEAR", "2010"),
    /** Logo lives in /public — replace the file to change it everywhere. */
    logo: "/multiflora-logo.png",
    logoFallback: "/multiflora-logo.svg",
  },

  /** SEO / метаданные ---------------------------------------------------- */
  seo: {
    titleDefault: env(
      "NEXT_PUBLIC_SEO_TITLE",
      "MultiFlora Garden — Питомник растений и ландшафтный дизайн"
    ),
    titleTemplate: "%s | {brand}",
    description: env(
      "NEXT_PUBLIC_SEO_DESCRIPTION",
      "Питомник растений: каталог комнатных и садовых растений, ландшафтный дизайн, уход за садом с AI-консультантом."
    ),
    keywords: [
      "растения",
      "питомник",
      "ландшафтный дизайн",
      "сад",
      "garden center",
      "plants",
      "landscape design",
    ],
  },

  /** Locale & currency / язык и валюта ----------------------------------- */
  locale: {
    /** BCP-47 tag for <html lang> and number/currency formatting. */
    lang: env("NEXT_PUBLIC_LOCALE", "ru-RU"),
    /** OpenGraph locale, e.g. ru_RU / en_GB / de_DE. */
    ogLocale: env("NEXT_PUBLIC_OG_LOCALE", "ru_RU"),
    /** ISO 4217 currency code, e.g. RUB / EUR / GBP. */
    currency: env("NEXT_PUBLIC_CURRENCY", "RUB"),
  },

  /** Contacts / контакты ------------------------------------------------- */
  contact: {
    phone: env("NEXT_PUBLIC_CONTACT_PHONE", "+7 (495) 123-45-67"),
    phoneHref: env("NEXT_PUBLIC_CONTACT_PHONE_HREF", "tel:+74951234567"),
    email: env("NEXT_PUBLIC_CONTACT_EMAIL", "info@multiflora.ru"),
    address: env("NEXT_PUBLIC_CONTACT_ADDRESS", "Москва, Садовое кольцо, 1"),
    hoursWeekday: env("NEXT_PUBLIC_HOURS_WEEKDAY", "9:00 – 20:00"),
    hoursWeekend: env("NEXT_PUBLIC_HOURS_WEEKEND", "10:00 – 18:00"),
    hoursShort: env("NEXT_PUBLIC_HOURS_SHORT", "Пн–Вс: 9:00 – 20:00"),
  },

  /** Navigation / навигация --------------------------------------------- */
  nav: [
    { href: "/garden", label: "Главная" },
    { href: "/catalog", label: "Каталог" },
    { href: "/services", label: "Услуги" },
    { href: "/contacts", label: "Контакты" },
  ] satisfies NavLink[],

  /** Homepage hero / первый экран --------------------------------------- */
  hero: {
    badge: "Premium Nature — с 2010 года",
    titleLead: "Ландшафтный дизайн и растения,",
    titleAccent: "которые преображают пространство",
    subtitle:
      "Питомник и студия ландшафтного дизайна. Создаём сады, которые радуют круглый год: от идеи до посадки и ухода.",
    primaryCta: { label: "В каталог", href: "/catalog" },
    secondaryCta: { label: "Заказать дизайн", href: "/services" },
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=85",
  },

  /** "Why us" features / преимущества ------------------------------------ */
  features: [
    {
      icon: "ShieldCheck",
      title: "Гарантия приживаемости",
      description:
        "Каждое растение сопровождаем рекомендациями по уходу и гарантией на посадочный материал.",
    },
    {
      icon: "Sprout",
      title: "Собственный питомник",
      description:
        "Выращиваем саженцы на собственной базе — только здоровые и адаптированные экземпляры.",
    },
    {
      icon: "Palette",
      title: "Ландшафтный дизайн",
      description:
        "Проектируем сады с учётом рельефа, освещения и вашего стиля жизни.",
    },
    {
      icon: "Truck",
      title: "Доставка и посадка",
      description:
        "Аккуратно доставляем и высаживаем растения с соблюдением агротехники.",
    },
  ] satisfies SiteFeature[],

  /** Footer about text / описание в подвале ------------------------------ */
  footerAbout:
    "Создаём гармоничные зелёные пространства — от подбора растений до ландшафтного дизайна под ключ.",
} as const;

export type SiteConfig = typeof siteConfig;

/** Resolved page-title template, e.g. "%s | MultiFlora Garden". */
export function titleTemplate(): string {
  return siteConfig.seo.titleTemplate.replace("{brand}", siteConfig.brand.name);
}
