import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { CallbackForm } from "@/components/forms/CallbackForm";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.ui.contactsTitle,
  description: `${siteConfig.brand.name}: ${siteConfig.ui.contactsSubtitle}.`,
};

const contactInfo = [
  {
    icon: Phone,
    title: siteConfig.ui.labelPhone,
    value: siteConfig.contact.phone,
    href: siteConfig.contact.phoneHref,
  },
  {
    icon: Mail,
    title: siteConfig.ui.labelEmail,
    value: siteConfig.contact.email,
    href: `mailto:${siteConfig.contact.email}`,
  },
  {
    icon: MapPin,
    title: siteConfig.ui.labelAddress,
    value: siteConfig.contact.address,
    href: undefined,
  },
  {
    icon: Clock,
    title: siteConfig.ui.labelHours,
    value: siteConfig.contact.hoursShort,
    href: undefined,
  },
];

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{siteConfig.ui.contactsTitle}</h1>
        <p className="mt-1 text-muted-foreground">
          {siteConfig.ui.contactsSubtitle}
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
