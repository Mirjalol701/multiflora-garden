import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ensureAdminAccess, isAdminEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
  return email[0].toUpperCase();
}

function isCallbackDone(status: string): boolean {
  return ["done", "completed", "выполнено"].includes(status.toLowerCase());
}

function getCallbackStatusLabel(status: string): {
  label: string;
  className: string;
} {
  if (isCallbackDone(status)) {
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

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/login" });
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
    <div className="group rounded-xl border border-[#1f1f1f] bg-[#111111] p-6 transition-all duration-200 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value.toLocaleString("ru-RU")}</p>
      <p className="mt-1 text-sm text-[#71717a]">{label}</p>
      <p className={`mt-3 text-sm font-medium ${footerColor}`}>{footer}</p>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");

  const email = session.user.email;
  const allowed =
    isAdminEmail(email) || (await ensureAdminAccess(session.user.id, email));

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6">
        <div className="max-w-md rounded-xl border border-[#1f1f1f] bg-[#111111] p-8 text-center">
          <p className="text-lg font-semibold text-white">Доступ запрещён</p>
          <p className="mt-2 text-sm text-[#71717a]">
            Аккаунт <span className="text-white">{email ?? "без email"}</span> не
            является администратором.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white"
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  if (isAdminEmail(email)) {
    void ensureAdminAccess(session.user.id, email).catch(() => {});
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalChats,
    chatsThisWeek,
    totalArtifacts,
    artifactsThisWeek,
    totalCallbacks,
    pendingCallbacks,
    totalMemories,
    totalProjects,
    recentUsers,
    recentCallbacks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.aiChat.count(),
    prisma.aiChat.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.artifact.count(),
    prisma.artifact.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.callbackRequest.count(),
    prisma.callbackRequest.count({
      where: {
        status: { notIn: ["done", "DONE", "completed", "COMPLETED"] },
      },
    }),
    prisma.memory.count(),
    prisma.project.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        userRole: true,
      },
    }),
    prisma.callbackRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        status: true,
      },
    }),
  ]);

  const userEmail = session.user.email ?? "admin@multiflora.local";
  const userName = session.user.name ?? userEmail;
  const userImage = session.user.image;

  const kpiCards: KpiCardProps[] = [
    {
      icon: "👥",
      iconBg: "bg-green-500/15",
      value: totalUsers,
      label: "Всего пользователей",
      footer: `+${newUsersToday} сегодня`,
      footerColor: "text-green-500",
    },
    {
      icon: "📈",
      iconBg: "bg-blue-500/15",
      value: newUsersWeek,
      label: "Новых за неделю",
      footer: `+${newUsersMonth} за месяц`,
      footerColor: "text-blue-400",
    },
    {
      icon: "💬",
      iconBg: "bg-purple-500/15",
      value: totalChats,
      label: "Всего чатов",
      footer: `+${chatsThisWeek} за неделю`,
      footerColor: "text-purple-400",
    },
    {
      icon: "📄",
      iconBg: "bg-orange-500/15",
      value: totalArtifacts,
      label: "Создано артефактов",
      footer: `+${artifactsThisWeek} за неделю`,
      footerColor: "text-orange-400",
    },
    {
      icon: "📞",
      iconBg: "bg-red-500/15",
      value: totalCallbacks,
      label: "Заявок на звонок",
      footer: `${pendingCallbacks} ожидают`,
      footerColor: pendingCallbacks > 0 ? "text-yellow-500" : "text-red-400",
    },
    {
      icon: "🧠",
      iconBg: "bg-teal-500/15",
      value: totalMemories,
      label: "Воспоминаний создано",
      footer: `${totalProjects} проектов`,
      footerColor: "text-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1f1f1f] bg-[#0a0a0a]/95 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-[#1f1f1f]">
            <Image
              src="/multiflora-logo.png"
              alt="MultiFlora"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-lg font-semibold text-white">MultiFlora</span>
          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
            Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-[#1f1f1f]"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-xs font-semibold text-green-500">
                {getInitials(session.user.name ?? null, userEmail)}
              </div>
            )}
            <span className="hidden text-sm text-[#71717a] sm:inline">{userEmail}</span>
          </div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="rounded-lg border border-[#1f1f1f] bg-[#111111] px-3 py-1.5 text-sm text-[#71717a] transition-colors hover:border-green-500/50 hover:text-white"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Title */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-white">Дашборд</h1>
            <p className="mt-1 text-[#71717a]">Статистика MultiFlora Garden</p>
          </div>
          <p className="text-sm text-[#71717a]">{formatDateTime(now)}</p>
        </div>
        <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-green-500 to-transparent" />

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        {/* Two Column Section */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          {/* Recent Users */}
          <section className="w-full lg:w-[60%]">
            <h2 className="mb-4 text-lg font-semibold text-white">Последние пользователи</h2>
            <div className="overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#111111]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1f1f1f] text-xs uppercase tracking-wide text-[#71717a]">
                    <th className="px-4 py-3 font-medium">Аватар</th>
                    <th className="px-4 py-3 font-medium">Имя</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Роль</th>
                    <th className="px-4 py-3 font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user, index) => {
                    const email = user.email ?? "—";
                    const isAdmin = user.userRole === "admin";
                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-[#1a1a1a] ${
                          index % 2 === 0 ? "bg-[#111111]" : "bg-[#0f0f0f]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt={user.name ?? email}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-xs font-medium text-[#71717a]">
                              {getInitials(user.name, email)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {user.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#71717a]">{email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                              isAdmin
                                ? "border-green-500/30 bg-green-500/15 text-green-500"
                                : "border-[#1f1f1f] bg-[#1a1a1a] text-[#71717a]"
                            }`}
                          >
                            {user.userRole ?? "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#71717a]">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#71717a]">
                        Пользователей пока нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Callbacks */}
          <section className="w-full lg:w-[40%]">
            <h2 className="mb-4 text-lg font-semibold text-white">Последние заявки</h2>
            <div className="flex flex-col gap-2">
              {recentCallbacks.map((callback) => {
                const statusBadge = getCallbackStatusLabel(callback.status);
                return (
                  <div
                    key={callback.id}
                    className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4 transition-colors hover:border-[#2a2a2a]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-white">{callback.name}</p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <a
                      href={`tel:${callback.phone}`}
                      className="mt-1 block text-sm font-medium text-green-500 transition-colors hover:text-green-400"
                    >
                      {callback.phone}
                    </a>
                    <p className="mt-2 text-xs text-[#71717a]">
                      {formatDate(callback.createdAt)}
                    </p>
                  </div>
                );
              })}
              {recentCallbacks.length === 0 && (
                <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-8 text-center text-[#71717a]">
                  Заявок пока нет
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Stats Bar */}
      <footer className="sticky bottom-0 border-t border-[#1f1f1f] bg-[#111111]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-0 px-6 py-4 sm:justify-between">
          {[
            { label: "Всего памяти", value: totalMemories },
            { label: "Всего проектов", value: totalProjects },
            { label: "Артефактов", value: totalArtifacts },
            { label: "Пользователей", value: totalUsers },
          ].map((stat, index, arr) => (
            <div key={stat.label} className="flex items-center">
              <div className="px-6 py-1 text-center sm:text-left">
                <p className="text-xs text-[#71717a]">{stat.label}</p>
                <p className="text-lg font-semibold text-white">
                  {stat.value.toLocaleString("ru-RU")}
                </p>
              </div>
              {index < arr.length - 1 && (
                <div className="hidden h-10 w-px bg-[#1f1f1f] sm:block" />
              )}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
