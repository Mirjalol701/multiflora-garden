import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyHandlerRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";
import { getServerEnv } from "@/server/env";
import { getPlantsForPlanner } from "@/actions/plants";
import {
  generateGardenPlan,
  type GardenPlanRequest,
} from "@/server/ai/garden-planner";
import type { PlantListItem } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_CHARS = 12_000_000; // ~9 MB base64

export async function POST(request: Request) {
  const session = await auth();
  const ip = getClientIpFromRequest(request);

  if (!session?.user?.id) {
    logSecurityEvent("unauthorized_api_access", {
      ip,
      endpoint: "/api/garden-plan",
      method: "POST",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await applyHandlerRateLimit(session.user.id, "AI_USER");
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  if (!getServerEnv("OPENAI_API_KEY")) {
    return NextResponse.json(
      { error: "AI is not configured (missing OPENAI_API_KEY)." },
      { status: 503 }
    );
  }

  let body: GardenPlanRequest;
  try {
    body = (await request.json()) as GardenPlanRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.imageDataUrl) {
    if (
      typeof body.imageDataUrl !== "string" ||
      !body.imageDataUrl.startsWith("data:image/")
    ) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    if (body.imageDataUrl.length > MAX_IMAGE_CHARS) {
      return NextResponse.json(
        { error: "Image too large (max ~8 MB)" },
        { status: 413 }
      );
    }
  }

  const catalog = await getPlantsForPlanner();
  if (catalog.length === 0) {
    return NextResponse.json(
      { error: "Catalog is empty. Seed plants first." },
      { status: 503 }
    );
  }

  try {
    const plan = await generateGardenPlan(
      {
        imageDataUrl: body.imageDataUrl,
        area: typeof body.area === "string" ? body.area.slice(0, 40) : undefined,
        sunlight: body.sunlight,
        budget:
          typeof body.budget === "string" ? body.budget.slice(0, 40) : undefined,
        style:
          typeof body.style === "string" ? body.style.slice(0, 60) : undefined,
        notes:
          typeof body.notes === "string" ? body.notes.slice(0, 500) : undefined,
        lang: body.lang,
      },
      catalog
    );

    const byId = new Map<string, PlantListItem>(catalog.map((p) => [p.id, p]));
    const recommendedPlants = plan.recommendedPlantIds
      .map((id) => byId.get(id))
      .filter((p): p is PlantListItem => Boolean(p));

    const estimateTotal = recommendedPlants.reduce(
      (sum, p) => sum + p.price,
      0
    );

    return NextResponse.json({
      analysis: plan.analysis,
      conditions: plan.conditions,
      careTips: plan.careTips,
      estimateNote: plan.estimateNote,
      plants: recommendedPlants,
      estimateTotal,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build the plan";
    logSecurityEvent("suspicious_input", {
      ip,
      userId: session.user.id,
      endpoint: "/api/garden-plan",
      issues: message,
    });
    return NextResponse.json(
      { error: "Failed to build the plan. Please try again." },
      { status: 502 }
    );
  }
}
