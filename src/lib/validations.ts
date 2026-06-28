import { z } from "zod";

const phoneRegex =
  /^(\+7|8)?[\s-]?\(?[489][0-9]{2}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;

export const CallbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100, "Имя не должно превышать 100 символов"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Введите корректный номер телефона"),
  /** Honeypot — must stay empty; bots often fill hidden fields. */
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export type CallbackInput = z.infer<typeof CallbackSchema>;

export const plantFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export type PlantFilterParams = z.infer<typeof plantFilterSchema>;

export const serviceFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(6),
});

export type ServiceFilterParams = z.infer<typeof serviceFilterSchema>;

const agentMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(32_000),
});

export const agentRunBodySchema = z.object({
  chatId: z.string().max(128).optional(),
  projectId: z.string().max(128).nullable().optional(),
  message: z.string().trim().min(1).max(32_000),
  mode: z.enum(["chat", "cowork", "code"]).optional(),
  history: z.array(agentMessageSchema).max(100).optional(),
  workspace: z.object({
    projects: z.array(
      z.object({
        id: z.string(),
        name: z.string().max(500),
        description: z.string().max(5000).optional(),
        instructions: z.string().max(10_000).optional(),
        color: z.string().max(32),
      })
    ),
    chats: z.array(
      z.object({
        id: z.string(),
        title: z.string().max(500),
        projectId: z.string().nullable().optional(),
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string().max(32_000),
          })
        ),
      })
    ),
    artifacts: z.array(
      z.object({
        id: z.string(),
        title: z.string().max(500),
        content: z.string().max(100_000),
        type: z.string().max(64),
        projectId: z.string().nullable().optional(),
      })
    ),
    memories: z.array(
      z.object({
        id: z.string(),
        content: z.string().max(10_000),
        status: z.string().max(32),
        projectId: z.string().nullable().optional(),
      })
    ),
    aiPreferences: z
      .object({
        tone: z.enum(["concise", "balanced", "detailed"]),
        proactivity: z.enum(["low", "medium", "high"]),
      })
      .optional(),
  }),
  imageAttachments: z
    .array(
      z.object({
        type: z.literal("image"),
        dataUrl: z.string().max(10_000_000),
        name: z.string().max(256),
      })
    )
    .max(5)
    .optional(),
});

export type AgentRunBody = z.infer<typeof agentRunBodySchema>;
