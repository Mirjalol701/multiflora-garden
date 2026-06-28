import Link from "next/link";
import { Clock, Leaf, Mail, MapPin, Phone } from "lucide-react";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог растений" },
  { href: "/services", label: "Услуги" },
  { href: "/contacts", label: "Контакты" },
];

export function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-stone-50">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-emerald-800">MultiFlora Garden</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-stone-600">
            Создаём гармоничные зелёные пространства с 2010 года — от подбора растений
            до ландшафтного дизайна под ключ.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-800">
            Навигация
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
            Контакты
          </h3>
          <ul className="space-y-3 text-sm text-stone-600">
            <li>
              <a
                href="tel:+74951234567"
                className="flex items-center gap-2.5 transition-colors duration-200 hover:text-emerald-800"
              >
                <Phone className="h-4 w-4 shrink-0 text-emerald-700" />
                +7 (495) 123-45-67
              </a>
            </li>
            <li>
              <a
                href="mailto:info@multiflora.ru"
                className="flex items-center gap-2.5 transition-colors duration-200 hover:text-emerald-800"
              >
                <Mail className="h-4 w-4 shrink-0 text-emerald-700" />
                info@multiflora.ru
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>Москва, Садовое кольцо, 1</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-800">
            График работы
          </h3>
          <ul className="space-y-3 text-sm text-stone-600">
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <p className="font-medium text-stone-700">Пн – Пт</p>
                <p>9:00 – 20:00</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <p className="font-medium text-stone-700">Сб – Вс</p>
                <p>10:00 – 18:00</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-emerald-100 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} MultiFlora Garden. Все права защищены.
      </div>
    </footer>
  );
}
