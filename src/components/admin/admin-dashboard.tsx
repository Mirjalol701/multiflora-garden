"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminStats } from "@/lib/admin-stats";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() ?? "?";
}

function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return provider;
}

function providerClass(provider: string): string {
  if (provider === "google") return "border-blue-500/30 bg-blue-500/15 text-blue-400";
  if (provider === "github") return "border-[#71717a]/30 bg-[#71717a]/15 text-[#a1a1aa]";
  return "border-[#1f1f1f] text-[#71717a]";
}

function getCallbackStatusLabel(status: string) {
  const done = ["done", "completed", "выполнено"].includes(status.toLowerCase());
  if (done) {
    return {
      label: "Выполнено",
      className: "bg-green-500/15 text-green-500 border-green-500/30",
    };
  }
  return {
    label: "Ожидает",
    className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  };
}

type KpiCardProps = {
  icon: string;
  iconBg: string;
  value: number;
  label: string;
  footer: string;
  footerColor: string;
};

function KpiCard({ icon, iconBg, value, label, footer, footerColor }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-5 transition-all hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.12)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${iconBg}`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value.toLocaleString("ru-RU")}</p>
      <p className="mt-1 text-sm text-[#71717a]">{label}</p>
      <p className={`mt-2 text-sm font-medium ${footerColor}`}>{footer}</p>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Ошибка ${res.status}`);
        }
        const data = (await res.json()) as AdminStats;
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить статистику");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const users = stats?.allUsers ?? stats?.recentUsers ?? [];
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q)
    );
  }, [stats, userSearch]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] p-8">
        <p className="text-[#71717a]">Загрузка статистики…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] p-8">
        <div className="rounded-xl border border-red-500/30 bg-[#111111] p-6 text-center">
          <p className="font-medium text-white">Не удалось открыть админ-панель</p>
          <p className="mt-2 text-sm text-[#71717a]">{error ?? "Нет данных"}</p>
        </div>
      </div>
    );
  }

  const kpiCards: KpiCardProps[] = [
    {
      icon: "👥",
      iconBg: "bg-green-500/15",
      value: stats.totalUsers,
      label: "Всего пользователей",
      footer: `+${stats.newUsersToday} сегодня`,
      footerColor: "text-green-500",
    },
    {
      icon: "📈",
      iconBg: "bg-blue-500/15",
      value: stats.newUsersWeek,
      label: "Новых за неделю",
      footer: `+${stats.newUsersMonth} за месяц`,
      footerColor: "text-blue-400",
    },
    {
      icon: "💬",
      iconBg: "bg-purple-500/15",
      value: stats.totalChats,
      label: "Всего чатов",
      footer: `+${stats.chatsThisWeek} за неделю`,
      footerColor: "text-purple-400",
    },
    {
      icon: "📄",
      iconBg: "bg-orange-500/15",
      value: stats.totalArtifacts,
      label: "Создано артефактов",
      footer: `+${stats.artifactsThisWeek} за неделю`,
      footerColor: "text-orange-400",
    },
    {
      icon: "📞",
      iconBg: "bg-red-500/15",
      value: stats.totalCallbacks,
      label: "Заявок на звонок",
      footer: `${stats.pendingCallbacks} ожидают`,
      footerColor: stats.pendingCallbacks > 0 ? "text-yellow-500" : "text-red-400",
    },
    {
      icon: "🧠",
      iconBg: "bg-teal-500/15",
      value: stats.totalMemories,
      label: "Воспоминаний создано",
      footer: `${stats.totalProjects} проектов`,
      footerColor: "text-teal-400",
    },
  ];

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="border-b border-[#1f1f1f] px-6 py-5">
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="mt-1 text-sm text-[#71717a]">Статистика MultiFlora Garden</p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-green-500 to-transparent" />
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Все авторизованные пользователи
                </h2>
                <p className="text-xs text-[#71717a]">
                  Gmail / email и способ входа (Google, GitHub)
                </p>
              </div>
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Поиск по email или имени…"
                className="rounded-lg border border-[#1f1f1f] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-[#71717a] focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#1f1f1f] bg-[#111111]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1f1f1f] text-xs uppercase text-[#71717a]">
                    <th className="px-4 py-3">Аватар</th>
                    <th className="px-4 py-3">Gmail / Email</th>
                    <th className="px-4 py-3">Имя</th>
                    <th className="px-4 py-3">Вход через</th>
                    <th className="px-4 py-3">Роль</th>
                    <th className="px-4 py-3">Дата входа</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => {
                    const email = user.email ?? "—";
                    const providers =
                      "providers" in user && Array.isArray(user.providers)
                        ? user.providers
                        : [];
                    return (
                      <tr
                        key={user.id}
                        className={i % 2 === 0 ? "bg-[#111111]" : "bg-[#0f0f0f]"}
                      >
                        <td className="px-4 py-3">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-xs text-[#71717a]">
                              {getInitials(user.name, email)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {email !== "—" ? (
                            <a
                              href={`mailto:${email}`}
                              className="font-medium text-green-500 hover:text-green-400"
                            >
                              {email}
                            </a>
                          ) : (
                            <span className="text-[#71717a]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{user.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {providers.length > 0 ? (
                              providers.map((p) => (
                                <span
                                  key={p}
                                  className={`rounded-full border px-2 py-0.5 text-xs ${providerClass(p)}`}
                                >
                                  {providerLabel(p)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#71717a]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${
                              user.userRole === "admin"
                                ? "border-green-500/30 bg-green-500/15 text-green-500"
                                : "border-[#1f1f1f] text-[#71717a]"
                            }`}
                          >
                            {user.userRole ?? "user"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#71717a]">
                          {formatDate(String(user.createdAt))}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#71717a]">
                        {userSearch ? "Никого не найдено" : "Пользователей пока нет"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[#71717a]">
              Показано {filteredUsers.length} из {stats.allUsers?.length ?? stats.totalUsers}{" "}
              пользователей
            </p>
          </section>

          <section className="lg:col-span-2">
            <h2 className="mb-3 text-base font-semibold">Последние заявки</h2>
            <div className="flex flex-col gap-2">
              {stats.recentCallbacks.map((cb) => {
                const badge = getCallbackStatusLabel(cb.status);
                return (
                  <div
                    key={cb.id}
                    className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{cb.name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <a href={`tel:${cb.phone}`} className="mt-1 block text-sm text-green-500">
                      {cb.phone}
                    </a>
                    <p className="mt-2 text-xs text-[#71717a]">
                      {formatDate(String(cb.createdAt))}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
