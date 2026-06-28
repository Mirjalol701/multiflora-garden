import type { ZyronTool } from "./types";

export const createArtifactTool: ZyronTool = {
  name: "create_artifact",
  schema: {
    name: "create_artifact",
    description:
      "Save a deliverable (document, plan, or code) as a workspace artifact",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Artifact title" },
        content: { type: "string", description: "Full artifact content in markdown" },
        type: {
          type: "string",
          enum: ["document", "code", "plan"],
          description: "Artifact type",
        },
      },
      required: ["title", "content"],
    },
  },

  async execute(args, ctx) {
    const title = String(args.title ?? "Untitled").trim();
    const content = String(args.content ?? "").trim();
    const artifactType = String(args.type ?? "document");

    if (!content) {
      throw new Error("Artifact content cannot be empty");
    }

    ctx.onArtifact?.({ title, content, artifactType });

    return {
      success: true,
      title,
      type: artifactType,
      chatId: ctx.chatId,
      projectId: ctx.projectId,
    };
  },

  summarize(result) {
    const r = result as { title?: string };
    return `Created artifact: ${r.title ?? "Untitled"}`;
  },
};
