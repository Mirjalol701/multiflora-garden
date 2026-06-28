import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { CallbackForm } from "@/components/forms/CallbackForm";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с MultiFlora Garden: адрес питомника, телефон, email. Закажите бесплатную консультацию садовника.",
};

const contactInfo = [
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (495) 123-45-67",
    href: "tel:+74951234567",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@multiflora.ru",
    href: "mailto:info@multiflora.ru",
  },
  {
    icon: MapPin,
    title: "Адрес",
    value: "Москва, Садовое кольцо, 1",
    href: undefined,
  },
  {
    icon: Clock,
    title: "Режим работы",
    value: "Пн–Вс: 9:00 – 20:00",
    href: undefined,
  },
];

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Контакты</h1>
        <p className="mt-1 text-muted-foreground">
          Мы всегда рады помочь с выбором растений и планированием сада
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {contactInfo.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex items-start gap-4 p-5">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  {item.href ? (
                    <a href={item.href} className="font-medium hover:text-primary">
                      {item.value}
                    </a>
                  ) : (
                    <p className="font-medium">{item.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CallbackForm />
      </div>
    </div>
  );
}
