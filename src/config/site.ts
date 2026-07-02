/**
 * ============================================================================
 *  WHITE-LABEL BRAND CONFIG  —  единая точка перебрендирования + локализация.
 * ----------------------------------------------------------------------------
 *  RU: Чтобы перепродать/переоформить сайт под другой садовый центр —
 *      измените значения в этом файле (и замените логотип в /public).
 *  EN: To rebrand this site for another garden center, edit values in THIS
 *      file (and replace the logo in /public). No other code changes.
 *
 *  Язык интерфейса переключается одной переменной окружения:
 *      NEXT_PUBLIC_LOCALE="ru-RU"   → русский (по умолчанию)
 *      NEXT_PUBLIC_LOCALE="en-GB"   → English  (для демо центрам в ЕС)
 *      NEXT_PUBLIC_LOCALE="de-DE"   → падает на English + немецкую валюту/формат
 * ============================================================================
 */

/**
 * NEXT_PUBLIC_* vars must be referenced STATICALLY so Next.js inlines them into
 * the client bundle. Dynamic process.env[key] access would return undefined on
 * the client and silently drop every override (incl. locale). Keep them here.
 */
const ENV = {
  BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  BRAND_SHORT_NAME: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME,
  BRAND_TAGLINE: process.env.NEXT_PUBLIC_BRAND_TAGLINE,
  BRAND_YEAR: process.env.NEXT_PUBLIC_BRAND_YEAR,
  SEO_TITLE: process.env.NEXT_PUBLIC_SEO_TITLE,
  SEO_DESCRIPTION: process.env.NEXT_PUBLIC_SEO_DESCRIPTION,
  LOCALE: process.env.NEXT_PUBLIC_LOCALE,
  OG_LOCALE: process.env.NEXT_PUBLIC_OG_LOCALE,
  CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
  CONTACT_PHONE: process.env.NEXT_PUBLIC_CONTACT_PHONE,
  CONTACT_PHONE_HREF: process.env.NEXT_PUBLIC_CONTACT_PHONE_HREF,
  CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  CONTACT_ADDRESS: process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
  HOURS_WEEKDAY: process.env.NEXT_PUBLIC_HOURS_WEEKDAY,
  HOURS_WEEKEND: process.env.NEXT_PUBLIC_HOURS_WEEKEND,
  HOURS_SHORT: process.env.NEXT_PUBLIC_HOURS_SHORT,
} as const;

function pick(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export type NavLink = { href: string; label: string };

export type SiteFeature = {
  icon: "ShieldCheck" | "Sprout" | "Palette" | "Truck" | "Leaf";
  title: string;
  description: string;
};

export type Locale = "ru" | "en";

/** Active language: everything non-English falls back to English content. */
const rawLocale = pick(ENV.LOCALE, "ru-RU");
export const activeLocale: Locale = rawLocale.toLowerCase().startsWith("ru")
  ? "ru"
  : "en";

/** Translatable content, one block per language. -------------------------- */
type LocaleContent = {
  tagline: string;
  seo: { titleDefault: string; description: string; keywords: string[] };
  nav: NavLink[];
  hero: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    image: string;
  };
  features: SiteFeature[];
  footerAbout: string;
  ui: {
    menu: string;
    signIn: string;
    consultation: string;
    whyUsTitle: string;
    whyUsSubtitle: string;
    popularPlantsTitle: string;
    popularPlantsSubtitle: string;
    viewCatalog: string;
    details: string;
    catalogEmpty: string;
    footerNav: string;
    footerContacts: string;
    footerHours: string;
    weekdays: string;
    weekend: string;
    rightsReserved: string;
    contactsTitle: string;
    contactsSubtitle: string;
    labelPhone: string;
    labelEmail: string;
    labelAddress: string;
    labelHours: string;
    servicesTitle: string;
    servicesSubtitle: string;
    // Garden planner ("photo → AI plan")
    plannerNav: string;
    plannerTitle: string;
    plannerSubtitle: string;
    plannerUpload: string;
    plannerUploadHint: string;
    plannerArea: string;
    plannerSunlight: string;
    plannerBudget: string;
    plannerStyle: string;
    plannerNotes: string;
    plannerNotesPlaceholder: string;
    plannerSubmit: string;
    plannerLoading: string;
    plannerResultTitle: string;
    plannerConditions: string;
    plannerRecommended: string;
    plannerCare: string;
    plannerEstimate: string;
    plannerRequestQuote: string;
    plannerError: string;
    plannerSunOptions: { full: string; partial: string; shade: string };
  };
};

const CONTENT: Record<Locale, LocaleContent> = {
  ru: {
    tagline: "Питомник & ландшафт",
    seo: {
      titleDefault: "MultiFlora Garden — Питомник растений и ландшафтный дизайн",
      description:
        "Питомник растений: каталог садовых растений, ландшафтный дизайн и AI-подбор растений по фото вашего участка.",
      keywords: [
        "растения",
        "питомник",
        "ландшафтный дизайн",
        "сад",
        "подбор растений",
      ],
    },
    nav: [
      { href: "/garden", label: "Главная" },
      { href: "/catalog", label: "Каталог" },
      { href: "/plan", label: "AI-план сада" },
      { href: "/services", label: "Услуги" },
      { href: "/contacts", label: "Контакты" },
    ],
    hero: {
      badge: "Premium Nature — с 2010 года",
      titleLead: "Ландшафтный дизайн и растения,",
      titleAccent: "которые преображают пространство",
      subtitle:
        "Питомник и студия ландшафтного дизайна. Загрузите фото участка — AI подберёт растения из нашего каталога и составит план сада.",
      primaryCta: { label: "AI-план по фото", href: "/plan" },
      secondaryCta: { label: "В каталог", href: "/catalog" },
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=85",
    },
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
        title: "AI-дизайн сада",
        description:
          "Загрузите фото участка — AI проанализирует условия и подберёт растения под ваш бюджет и стиль.",
      },
      {
        icon: "Truck",
        title: "Доставка и посадка",
        description:
          "Аккуратно доставляем и высаживаем растения с соблюдением агротехники.",
      },
    ],
    footerAbout:
      "Создаём гармоничные зелёные пространства — от AI-подбора растений до ландшафтного дизайна под ключ.",
    ui: {
      menu: "Меню",
      signIn: "Войти",
      consultation: "Консультация",
      whyUsTitle: "Почему выбирают нас",
      whyUsSubtitle:
        "Сочетаем природную эстетику с профессиональным подходом к каждому проекту",
      popularPlantsTitle: "Популярные растения",
      popularPlantsSubtitle: "Лучшие предложения из нашего питомника этого сезона",
      viewCatalog: "Весь каталог",
      details: "Подробнее",
      catalogEmpty: "Каталог скоро будет доступен.",
      footerNav: "Навигация",
      footerContacts: "Контакты",
      footerHours: "График работы",
      weekdays: "Пн – Пт",
      weekend: "Сб – Вс",
      rightsReserved: "Все права защищены.",
      contactsTitle: "Контакты",
      contactsSubtitle:
        "Мы всегда рады помочь с выбором растений и планированием сада",
      labelPhone: "Телефон",
      labelEmail: "Email",
      labelAddress: "Адрес",
      labelHours: "Режим работы",
      servicesTitle: "Наши услуги",
      servicesSubtitle: "Профессиональный уход за вашим садом и зелёными зонами",
      plannerNav: "AI-план сада",
      plannerTitle: "AI-план сада по фото участка",
      plannerSubtitle:
        "Загрузите фото участка, укажите условия — и получите план озеленения с растениями из нашего каталога и сметой.",
      plannerUpload: "Фото участка",
      plannerUploadHint: "JPG или PNG, до 8 МБ",
      plannerArea: "Площадь участка (м²)",
      plannerSunlight: "Освещённость",
      plannerBudget: "Бюджет",
      plannerStyle: "Стиль сада",
      plannerNotes: "Пожелания (необязательно)",
      plannerNotesPlaceholder:
        "Например: хвойные вечнозелёные, низкий уход, цветение летом…",
      plannerSubmit: "Составить AI-план",
      plannerLoading: "AI анализирует участок…",
      plannerResultTitle: "Ваш AI-план сада",
      plannerConditions: "Анализ участка",
      plannerRecommended: "Рекомендованные растения",
      plannerCare: "Рекомендации по уходу",
      plannerEstimate: "Ориентировочная смета",
      plannerRequestQuote: "Заказать посадку",
      plannerError: "Не удалось составить план. Попробуйте ещё раз.",
      plannerSunOptions: {
        full: "Солнечно",
        partial: "Полутень",
        shade: "Тень",
      },
    },
  },

  en: {
    tagline: "Nursery & Landscape",
    seo: {
      titleDefault: "MultiFlora Garden — Plant Nursery & Landscape Design",
      description:
        "Plant nursery: garden plant catalog, landscape design, and AI plant selection from a photo of your garden.",
      keywords: [
        "plants",
        "garden center",
        "nursery",
        "landscape design",
        "plant selection",
      ],
    },
    nav: [
      { href: "/garden", label: "Home" },
      { href: "/catalog", label: "Catalog" },
      { href: "/plan", label: "AI Garden Plan" },
      { href: "/services", label: "Services" },
      { href: "/contacts", label: "Contacts" },
    ],
    hero: {
      badge: "Premium Nature — since 2010",
      titleLead: "Landscape design and plants",
      titleAccent: "that transform your space",
      subtitle:
        "A plant nursery and landscape studio. Upload a photo of your garden — our AI selects plants from our catalog and builds a planting plan.",
      primaryCta: { label: "AI plan from photo", href: "/plan" },
      secondaryCta: { label: "Browse catalog", href: "/catalog" },
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=85",
    },
    features: [
      {
        icon: "ShieldCheck",
        title: "Establishment guarantee",
        description:
          "Every plant comes with care guidance and a guarantee on the planting material.",
      },
      {
        icon: "Sprout",
        title: "Own nursery",
        description:
          "We grow our stock on-site — only healthy, climate-adapted specimens.",
      },
      {
        icon: "Palette",
        title: "AI garden design",
        description:
          "Upload a photo of your plot — AI analyses conditions and selects plants for your budget and style.",
      },
      {
        icon: "Truck",
        title: "Delivery & planting",
        description:
          "We carefully deliver and plant, following proper horticultural practice.",
      },
    ],
    footerAbout:
      "We create harmonious green spaces — from AI plant selection to turnkey landscape design.",
    ui: {
      menu: "Menu",
      signIn: "Sign in",
      consultation: "Get a consultation",
      whyUsTitle: "Why choose us",
      whyUsSubtitle:
        "We combine natural aesthetics with a professional approach to every project",
      popularPlantsTitle: "Popular plants",
      popularPlantsSubtitle: "The best offers from our nursery this season",
      viewCatalog: "Full catalog",
      details: "Details",
      catalogEmpty: "The catalog will be available soon.",
      footerNav: "Navigation",
      footerContacts: "Contacts",
      footerHours: "Opening hours",
      weekdays: "Mon – Fri",
      weekend: "Sat – Sun",
      rightsReserved: "All rights reserved.",
      contactsTitle: "Contacts",
      contactsSubtitle:
        "We are always happy to help you choose plants and plan your garden",
      labelPhone: "Phone",
      labelEmail: "Email",
      labelAddress: "Address",
      labelHours: "Opening hours",
      servicesTitle: "Our services",
      servicesSubtitle: "Professional care for your garden and green areas",
      plannerNav: "AI Garden Plan",
      plannerTitle: "AI garden plan from a photo of your plot",
      plannerSubtitle:
        "Upload a photo of your plot, set the conditions — and get a planting plan with plants from our catalog and a cost estimate.",
      plannerUpload: "Photo of your plot",
      plannerUploadHint: "JPG or PNG, up to 8 MB",
      plannerArea: "Plot area (m²)",
      plannerSunlight: "Sunlight",
      plannerBudget: "Budget",
      plannerStyle: "Garden style",
      plannerNotes: "Notes (optional)",
      plannerNotesPlaceholder:
        "e.g. evergreen conifers, low maintenance, summer blooms…",
      plannerSubmit: "Build AI plan",
      plannerLoading: "AI is analysing your plot…",
      plannerResultTitle: "Your AI garden plan",
      plannerConditions: "Plot analysis",
      plannerRecommended: "Recommended plants",
      plannerCare: "Care recommendations",
      plannerEstimate: "Estimated cost",
      plannerRequestQuote: "Request planting",
      plannerError: "Could not build the plan. Please try again.",
      plannerSunOptions: {
        full: "Full sun",
        partial: "Partial shade",
        shade: "Shade",
      },
    },
  },
};

const content = CONTENT[activeLocale];

export const siteConfig = {
  /** Brand / бренд ------------------------------------------------------- */
  brand: {
    name: pick(ENV.BRAND_NAME, "MultiFlora Garden"),
    shortName: pick(ENV.BRAND_SHORT_NAME, "MultiFlora"),
    tagline: pick(ENV.BRAND_TAGLINE, content.tagline),
    establishedYear: pick(ENV.BRAND_YEAR, "2010"),
    logo: "/multiflora-logo.png",
    logoFallback: "/multiflora-logo.svg",
  },

  /** SEO / метаданные (env override wins over locale content) ------------- */
  seo: {
    titleDefault: pick(ENV.SEO_TITLE, content.seo.titleDefault),
    titleTemplate: "%s | {brand}",
    description: pick(ENV.SEO_DESCRIPTION, content.seo.description),
    keywords: content.seo.keywords,
  },

  /** Locale & currency / язык и валюта ----------------------------------- */
  locale: {
    lang: rawLocale,
    ogLocale: pick(ENV.OG_LOCALE, activeLocale === "ru" ? "ru_RU" : "en_GB"),
    currency: pick(ENV.CURRENCY, "RUB"),
    active: activeLocale,
  },

  /** Contacts / контакты ------------------------------------------------- */
  contact: {
    phone: pick(ENV.CONTACT_PHONE, "+7 (495) 123-45-67"),
    phoneHref: pick(ENV.CONTACT_PHONE_HREF, "tel:+74951234567"),
    email: pick(ENV.CONTACT_EMAIL, "info@multiflora.ru"),
    address: pick(ENV.CONTACT_ADDRESS, "Москва, Садовое кольцо, 1"),
    hoursWeekday: pick(ENV.HOURS_WEEKDAY, "9:00 – 20:00"),
    hoursWeekend: pick(ENV.HOURS_WEEKEND, "10:00 – 18:00"),
    hoursShort: pick(
      ENV.HOURS_SHORT,
      activeLocale === "ru" ? "Пн–Вс: 9:00 – 20:00" : "Mon–Sun: 9:00 – 20:00"
    ),
  },

  /** Localized content --------------------------------------------------- */
  nav: content.nav,
  hero: content.hero,
  features: content.features,
  footerAbout: content.footerAbout,
  ui: content.ui,
} as const;

export type SiteConfig = typeof siteConfig;

/** Resolved page-title template, e.g. "%s | MultiFlora Garden". */
export function titleTemplate(): string {
  return siteConfig.seo.titleTemplate.replace("{brand}", siteConfig.brand.name);
}
