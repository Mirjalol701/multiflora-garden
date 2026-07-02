import { modelRouter } from "@/server/ai/router";
import type { PlantListItem } from "@/types";

export type GardenPlanRequest = {
  imageDataUrl?: string;
  area?: string;
  sunlight?: "full" | "partial" | "shade";
  budget?: string;
  style?: string;
  notes?: string;
  /** UI language for the AI response: "ru" | "en". */
  lang?: string;
};

export type GardenPlanResult = {
  analysis: string;
  conditions: string[];
  recommendedPlantIds: string[];
  careTips: string[];
  estimateNote: string;
};

type RawPlan = {
  analysis?: unknown;
  conditions?: unknown;
  recommendedPlantIds?: unknown;
  careTips?: unknown;
  estimateNote?: unknown;
};

function asStringArray(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

function extractJson(text: string): RawPlan | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as RawPlan;
  } catch {
    return null;
  }
}

function buildCatalogList(plants: PlantListItem[]): string {
  return plants
    .map(
      (p) =>
        `- id=${p.id} | ${p.name} | category=${p.category} | price=${p.price} | ${p.description.slice(0, 120)}`
    )
    .join("\n");
}

/**
 * Vision-powered garden planner: analyses a photo of the plot + user conditions,
 * then selects real catalog plants and returns a structured plan.
 */
export async function generateGardenPlan(
  req: GardenPlanRequest,
  catalog: PlantListItem[]
): Promise<GardenPlanResult> {
  const { provider, config } = modelRouter.forZyron();

  const responseLang =
    (req.lang ?? "ru").toLowerCase().startsWith("en") ? "English" : "Russian";

  const catalogIds = new Set(catalog.map((p) => p.id));

  const system = `You are an expert horticulturist and landscape designer for a plant nursery.
You receive a photo of a customer's plot (optional) and their conditions.
Analyse the site and design a realistic planting plan.

CRITICAL RULES:
- Recommend ONLY plants from the provided catalog, using their exact "id" values.
- Respect the user's budget and sunlight when selecting plants.
- Pick 3–7 complementary plants that work well together for the given conditions.
- Write all human-readable text in ${responseLang}.
- Output ONLY valid JSON, no markdown, matching exactly this shape:
{
  "analysis": "2-4 sentences describing the plot and design idea",
  "conditions": ["short bullet about light", "about soil/space", "..."],
  "recommendedPlantIds": ["<catalog id>", "..."],
  "careTips": ["practical care tip", "..."],
  "estimateNote": "1 sentence about the estimate / next step"
}`;

  const userParts: string[] = [];
  userParts.push("Customer conditions:");
  if (req.area) userParts.push(`- Plot area: ${req.area} m²`);
  if (req.sunlight) userParts.push(`- Sunlight: ${req.sunlight}`);
  if (req.budget) userParts.push(`- Budget: ${req.budget}`);
  if (req.style) userParts.push(`- Preferred style: ${req.style}`);
  if (req.notes) userParts.push(`- Notes: ${req.notes}`);
  userParts.push("");
  userParts.push("Available catalog (recommend only these, by id):");
  userParts.push(buildCatalogList(catalog));
  if (req.imageDataUrl) {
    userParts.push("");
    userParts.push("A photo of the plot is attached — analyse it.");
  }

  const imageAttachments = req.imageDataUrl
    ? [{ dataUrl: req.imageDataUrl, name: "plot.jpg" }]
    : undefined;

  const result = await provider.complete({
    system,
    messages: [{ role: "user", content: userParts.join("\n") }],
    model: config.model,
    temperature: 0.4,
    maxTokens: 1200,
    imageAttachments,
  });

  const raw = extractJson(result.text);
  if (!raw) {
    throw new Error("AI returned an unparseable plan");
  }

  const recommendedPlantIds = asStringArray(raw.recommendedPlantIds, 7).filter(
    (id) => catalogIds.has(id)
  );

  return {
    analysis:
      typeof raw.analysis === "string" ? raw.analysis.trim() : "",
    conditions: asStringArray(raw.conditions, 6),
    recommendedPlantIds,
    careTips: asStringArray(raw.careTips, 6),
    estimateNote:
      typeof raw.estimateNote === "string" ? raw.estimateNote.trim() : "",
  };
}
