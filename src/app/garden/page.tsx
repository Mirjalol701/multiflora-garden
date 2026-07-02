import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Leaf,
  Palette,
  ShieldCheck,
  Sprout,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { getFeaturedPlants } from "@/actions/plants";
import { PlantCard } from "@/components/catalog/plant-card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const revalidate = 60;

const featureIcons: Record<string, LucideIcon> = {
  ShieldCheck,
  Sprout,
  Palette,
  Truck,
  Leaf,
};

const features = siteConfig.features.map((feature) => ({
  ...feature,
  Icon: featureIcons[feature.icon] ?? Leaf,
}));

export default async function GardenHomePage() {
  const plants = await getFeaturedPlants(4);
  const { hero } = siteConfig;

  return (
    <>
      <section className="relative min-h-[85vh] overflow-hidden">
        <Image
          src={hero.image}
          alt="Пышный сад с зелёными растениями и цветами"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-900/30" />

        <div className="container relative mx-auto flex min-h-[85vh] items-center px-4 py-20">
          <div className="max-w-2xl space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-50 backdrop-blur-sm">
              <Leaf className="h-4 w-4" />
              {hero.badge}
            </span>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {hero.titleLead}{" "}
              <span className="text-emerald-200">{hero.titleAccent}</span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-emerald-50/90">
              {hero.subtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500 hover:shadow-xl"
              >
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:text-white"
              >
                <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-emerald-800 sm:text-4xl">
              {siteConfig.ui.whyUsTitle}
            </h2>
            <p className="mt-3 text-stone-600">{siteConfig.ui.whyUsSubtitle}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-emerald-100 bg-stone-50/50 p-6 transition-all duration-300 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 transition-colors duration-300 group-hover:bg-emerald-800 group-hover:text-white">
                  <feature.Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="font-semibold text-emerald-800">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-emerald-800 sm:text-4xl">
                {siteConfig.ui.popularPlantsTitle}
              </h2>
              <p className="mt-2 text-stone-600">
                {siteConfig.ui.popularPlantsSubtitle}
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-emerald-800 transition-colors duration-200 hover:bg-emerald-50 hover:text-emerald-900"
            >
              <Link href="/catalog">
                {siteConfig.ui.viewCatalog}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {plants.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white py-16 text-center">
              <p className="text-stone-600">
                {siteConfig.ui.catalogEmpty}{" "}
                <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-sm text-emerald-800">
                  npm run db:seed
                </code>
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
