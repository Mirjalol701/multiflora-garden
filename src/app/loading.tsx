import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MultiFlora Garden",
  description: "Питомник растений и ландшафтный дизайн",
};

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
