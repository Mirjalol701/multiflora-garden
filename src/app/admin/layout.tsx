import type { ReactNode } from "react";

export const metadata = {
  title: "Admin — MultiFlora Garden",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">{children}</div>
  );
}
