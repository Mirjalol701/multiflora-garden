import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { GardenPlannerForm } from "@/components/planner/garden-planner-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.ui.plannerNav,
  description: siteConfig.ui.plannerSubtitle,
};

export default function GardenPlanPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-800">
          <Sparkles className="h-4 w-4" />
          AI
        </span>
        <h1 className="text-3xl font-bold text-emerald-900 sm:text-4xl">
          {siteConfig.ui.plannerTitle}
        </h1>
        <p className="mt-3 text-stone-600">{siteConfig.ui.plannerSubtitle}</p>
      </div>

      <GardenPlannerForm />
    </div>
  );
}
