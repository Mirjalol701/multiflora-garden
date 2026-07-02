"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  Sparkles,
  Sun,
  CloudSun,
  Cloud,
  Leaf,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { PlantListItem } from "@/types";

type Sunlight = "full" | "partial" | "shade";

type PlanResponse = {
  analysis: string;
  conditions: string[];
  careTips: string[];
  estimateNote: string;
  plants: PlantListItem[];
  estimateTotal: number;
};

const MAX_BYTES = 8 * 1024 * 1024;

export function GardenPlannerForm() {
  const ui = siteConfig.ui;
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [sunlight, setSunlight] = useState<Sunlight>("full");
  const [budget, setBudget] = useState("");
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sunOptions: { value: Sunlight; label: string; Icon: typeof Sun }[] = [
    { value: "full", label: ui.plannerSunOptions.full, Icon: Sun },
    { value: "partial", label: ui.plannerSunOptions.partial, Icon: CloudSun },
    { value: "shade", label: ui.plannerSunOptions.shade, Icon: Cloud },
  ];

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(ui.plannerUploadHint);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedLogin(false);
    setPlan(null);

    try {
      const res = await fetch("/api/garden-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          area,
          sunlight,
          budget,
          style,
          notes,
          lang: siteConfig.locale.active,
        }),
      });

      if (res.status === 401) {
        setNeedLogin(true);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? ui.plannerError);
        return;
      }

      setPlan((await res.json()) as PlanResponse);
    } catch {
      setError(ui.plannerError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form
        onSubmit={onSubmit}
        className="h-fit space-y-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            {ui.plannerUpload}
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            {imageDataUrl ? (
              <Image
                src={imageDataUrl}
                alt="plot"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm">
                <Upload className="h-6 w-6" />
                {ui.plannerUpload}
                <span className="text-xs text-stone-400">
                  {ui.plannerUploadHint}
                </span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              {ui.plannerArea}
            </label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              inputMode="numeric"
              placeholder="50"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              {ui.plannerBudget}
            </label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={formatPrice(30000)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            {ui.plannerSunlight}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {sunOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSunlight(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
                  sunlight === opt.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-stone-200 text-stone-600 hover:border-emerald-200"
                )}
              >
                <opt.Icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            {ui.plannerStyle}
          </label>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Mediterranean / English / Minimal"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            {ui.plannerNotes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={ui.plannerNotesPlaceholder}
            className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {ui.plannerLoading}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {ui.plannerSubmit}
            </>
          )}
        </Button>

        {needLogin && (
          <p className="text-sm text-stone-600">
            <Link href="/login" className="font-medium text-emerald-700 underline">
              {siteConfig.ui.consultation}
            </Link>
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="min-h-[300px]">
        {!plan && !loading && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-10 text-center text-stone-500">
            <Leaf className="mb-3 h-8 w-8 text-emerald-400" />
            <p className="max-w-sm text-sm">{ui.plannerSubtitle}</p>
          </div>
        )}

        {loading && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white p-10 text-center text-emerald-700">
            <Loader2 className="mb-3 h-8 w-8 animate-spin" />
            <p className="text-sm">{ui.plannerLoading}</p>
          </div>
        )}

        {plan && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold text-emerald-800">
                <Sparkles className="h-5 w-5" />
                {ui.plannerResultTitle}
              </h2>
              <p className="mt-3 leading-relaxed text-stone-700">
                {plan.analysis}
              </p>
              {plan.conditions.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    {ui.plannerConditions}
                  </h3>
                  <ul className="space-y-1 text-sm text-stone-600">
                    {plan.conditions.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-500">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {plan.plants.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-emerald-800">
                  {ui.plannerRecommended}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {plan.plants.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3] bg-emerald-50">
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-stone-800">
                          {p.name}
                        </p>
                        <p className="text-xs text-stone-500">{p.category}</p>
                        <p className="mt-1 font-bold text-emerald-800">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {plan.careTips.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  {ui.plannerCare}
                </h3>
                <ul className="space-y-1.5 text-sm text-stone-600">
                  {plan.careTips.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-emerald-700">{ui.plannerEstimate}</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatPrice(plan.estimateTotal)}
                </p>
                {plan.estimateNote && (
                  <p className="mt-1 text-xs text-emerald-700/80">
                    {plan.estimateNote}
                  </p>
                )}
              </div>
              <Button
                asChild
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <Link href="/contacts">
                  {ui.plannerRequestQuote}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
