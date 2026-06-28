import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { ServiceListItem } from "@/types";

type ServiceCardProps = {
  service: ServiceListItem;
};

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Услуга
        </span>
        <CardTitle className="text-xl">{service.title}</CardTitle>
        <CardDescription className="line-clamp-3">{service.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-bold text-primary">
          от {formatPrice(service.price)}
        </p>
      </CardContent>
    </Card>
  );
}
