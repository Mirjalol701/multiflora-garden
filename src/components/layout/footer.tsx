import Link from "next/link";
import { Clock, Leaf, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";

const navLinks = siteConfig.nav;

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-stone-50">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-emerald-800">
              {siteConfig.brand.name}
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-stone-600">
            {siteConfig.footerAbout}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-800">
            {siteConfig.ui.footerNav}
          </h3>
          <ul className="space-y-2.5">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-stone-600 transition-colors duration-200 hover:text-emerald-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-800">
            {siteConfig.ui.footerContacts}
          </h3>
          <ul className="space-y-3 text-sm text-stone-600">
            <li>
              <a
                href={siteConfig.contact.phoneHref}
                className="flex items-center gap-2.5 transition-colors duration-200 hover:text-emerald-800"
              >
                <Phone className="h-4 w-4 shrink-0 text-emerald-700" />
                {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2.5 transition-colors duration-200 hover:text-emerald-800"
              >
                <Mail className="h-4 w-4 shrink-0 text-emerald-700" />
                {siteConfig.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>{siteConfig.contact.address}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-800">
            {siteConfig.ui.footerHours}
          </h3>
          <ul className="space-y-3 text-sm text-stone-600">
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <p className="font-medium text-stone-700">{siteConfig.ui.weekdays}</p>
                <p>{siteConfig.contact.hoursWeekday}</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <p className="font-medium text-stone-700">{siteConfig.ui.weekend}</p>
                <p>{siteConfig.contact.hoursWeekend}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-emerald-100 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {siteConfig.brand.name}. {siteConfig.ui.rightsReserved}
      </div>
    </footer>
  );
}
