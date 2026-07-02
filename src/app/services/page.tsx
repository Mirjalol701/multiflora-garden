import type { Metadata } from "next";
import { getServices } from "@/actions/services";
import { ServiceCard } from "@/components/services/service-card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.ui.servicesTitle,
  description: `${siteConfig.ui.servicesTitle} — ${siteConfig.brand.name}. ${siteConfig.ui.servicesSubtitle}.`,
};

export const revalidate = 60;

export default async function ServicesPage() {
  const { items: services } = await getServices();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{siteConfig.ui.servicesTitle}</h1>
        <p className="mt-1 text-muted-foreground">
          {siteConfig.ui.servicesSubtitle}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
