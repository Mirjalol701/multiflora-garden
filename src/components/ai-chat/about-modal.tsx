"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Leaf, Linkedin, Mail, MessageCircle, X, ZoomIn } from "lucide-react";
import { MultiFloraBrandLogo } from "@/components/ai-chat/multiflora-logo";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

type TeamMember = {
  name: string;
  role: string;
  badge: string;
  bio: string;
  age?: string;
  photo?: string;
  photoFocus?: string;
  stack?: string[];
  linkedin?: string;
};

type PhotoLightbox = {
  src: string;
  name: string;
};

type SocialLink = {
  label: string;
  icon: typeof MessageCircle;
  href: string;
  external?: boolean;
};

const socialLinks: SocialLink[] = [
  {
    label: "@MULTIFLORA_ADMIN",
    icon: MessageCircle,
    href: "https://t.me/MULTIFLORA_ADMIN",
    external: true,
  },
  {
    label: "Email",
    icon: Mail,
    href: "mailto:multifloragarden2026@gmail.com",
  },
  {
    label: "Сайт",
    icon: Globe,
    href: "https://www.multiflora.uz/",
    external: true,
  },
];

const team: TeamMember[] = [
  {
    name: "Sharifxon Talibjanov",
    role: "CEO & Founder",
    badge: "CEO",
    bio: "Основатель MultiFlora и EcoSeeds. Энтузиаст экологии и устойчивого развития.",
    age: "28 лет",
    photo: "/team/sharifxon.jpg",
    photoFocus: "50% 10%",
  },
  {
    name: "Mirjalol Bozorov",
    role: "Lead Developer & Architect",
    badge: "Dev",
    age: "22 года",
    bio: "Архитектор всей платформы MultiFlora AI. Строит системы которые масштабируются. Full-stack разработчик с глубоким пониманием AI интеграций, баз данных и продуктового мышления. В 22 года уже строит продукты которыми пользуются тысячи.",
    photo: "/team/mirjalol.jpg",
    photoFocus: "center",
    stack: ["Next.js", "Prisma", "TypeScript", "AI"],
  },
  {
    name: "Имя",
    role: "Plant Expert",
    badge: "Expert",
    bio: "Ботаник с 10-летним опытом. Консультирует по контенту.",
  },
];

function TeamAvatar({
  name,
  photo,
  photoFocus = "center_18%",
  onPhotoClick,
}: {
  name: string;
  photo?: string;
  photoFocus?: string;
  onPhotoClick?: () => void;
}) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = "h-28 w-28";

  if (photo) {
    return (
      <button
        type="button"
        onClick={onPhotoClick}
        aria-label={`Открыть фото — ${name}`}
        className={`group relative ${sizeClass} shrink-0 cursor-zoom-in rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-[#bbf7d0] ring-offset-2 ring-offset-white transition-transform group-hover:scale-[1.03]`}
          style={{ objectPosition: photoFocus }}
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/20">
          <ZoomIn className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </button>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-[#16a34a] text-2xl font-semibold text-white ring-2 ring-[#bbf7d0] ring-offset-2 ring-offset-white`}
    >
      {initial}
    </div>
  );
}

function TeamCard({
  member,
  onPhotoClick,
}: {
  member: TeamMember;
  onPhotoClick: (photo: PhotoLightbox) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={spring}
      className="flex min-w-[240px] shrink-0 flex-col items-center rounded-xl border border-[#e5e7eb] bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md sm:min-w-0"
    >
      <TeamAvatar
        name={member.name}
        photo={member.photo}
        photoFocus={member.photoFocus}
        onPhotoClick={
          member.photo
            ? () => onPhotoClick({ src: member.photo!, name: member.name })
            : undefined
        }
      />
      <h3 className="mt-4 text-[15px] font-semibold leading-snug text-[#111827]">
        {member.name}
      </h3>
      {member.age && (
        <p className="mt-0.5 text-[12px] text-[#6b7280]">{member.age}</p>
      )}
      <span className="mt-1.5 inline-block rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-[11px] font-medium text-[#16a34a] ring-1 ring-[#bbf7d0]">
        {member.badge}
      </span>
      <p className="mt-1.5 text-[12px] font-medium text-[#6b7280]">{member.role}</p>
      <p className="mt-2 text-left text-[12px] leading-relaxed text-[#6b7280]">{member.bio}</p>
      {member.stack && member.stack.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {member.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-medium text-[#16a34a] ring-1 ring-[#bbf7d0]"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
      {member.linkedin && (
        <a
          href={member.linkedin}
          aria-label={`LinkedIn — ${member.name}`}
          className="mt-3 inline-flex items-center justify-center rounded-lg p-2 text-[#6b7280] transition-colors hover:bg-[#f0fdf4] hover:text-[#16a34a]"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      )}
    </motion.div>
  );
}

function PhotoLightboxView({
  photo,
  onClose,
}: {
  photo: PhotoLightbox;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Закрыть фото"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={spring}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-1.5 text-[#111827] shadow-sm transition-colors hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.name}
          className="max-h-[75vh] w-full object-contain bg-[#f9fafb]"
        />
        <p className="border-t border-[#e5e7eb] px-4 py-3 text-center text-[14px] font-medium text-[#111827]">
          {photo.name}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoLightbox | null>(null);

  useEffect(() => {
    if (!open) {
      setLightboxPhoto(null);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightboxPhoto) {
        setLightboxPhoto(null);
      } else {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, lightboxPhoto]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Закрыть"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-labelledby="about-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={spring}
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f0fdf4] hover:text-[#111827]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto px-6 pb-6 pt-8 text-center">
              <MultiFloraBrandLogo size="md" className="mx-auto mb-4 shadow-sm" />

              <h2 id="about-title" className="text-xl font-bold text-[#111827]">
                MultiFlora <span className="text-[#6b7280]">AI</span>
              </h2>
              <p className="mt-1 text-[11px] text-[#6b7280]">powered by Mirjalol</p>

              <p className="mx-auto mt-5 max-w-lg text-[14px] leading-relaxed text-[#6b7280]">
                MultiFlora AI — умный ИИ помощник по уходу за растениями. Создан Mirjalol
                для помощи каждому растениеводу.
              </p>

              <div className="mt-8 w-full border-t border-[#e5e7eb] pt-6 text-left">
                <div className="mb-5 flex items-center justify-center gap-2">
                  <Leaf className="h-4 w-4 text-[#16a34a]" strokeWidth={2} />
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#111827]">
                    Наша команда
                  </h3>
                </div>

                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
                  {team.map((member) => (
                    <TeamCard
                      key={`${member.name}-${member.role}`}
                      member={member}
                      onPhotoClick={setLightboxPhoto}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 w-full border-t border-[#e5e7eb] pt-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
                  Контакты
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[13px] text-[#111827] transition-colors hover:border-[#bbf7d0] hover:bg-[#f0fdf4] hover:text-[#16a34a]"
                    >
                      <link.icon className="h-3.5 w-3.5 text-[#16a34a]" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-lg bg-[#16a34a] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#15803d]"
              >
                Закрыть
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {lightboxPhoto && (
              <PhotoLightboxView
                photo={lightboxPhoto}
                onClose={() => setLightboxPhoto(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
