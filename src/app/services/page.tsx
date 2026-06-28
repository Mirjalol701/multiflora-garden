import type { Metadata } from "next";
import { getServices } from "@/actions/services";
import { ServiceCard } from "@/components/services/service-card";

export const metadata: Metadata = {
  title: "Услуги",
  description:
    "Ландшафтный дизайн, уход за садом, консультации садовника и доставка растений от MultiFlora Garden.",
};

export const revalidate = 60;

export default async function ServicesPage() {
  const { items: services } = await getServices();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Наши услуги</h1>
        <p className="mt-1 text-muted-foreground">
          Профессиональный уход за вашим садом и зелёными зонами
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
