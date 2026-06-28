export type ChatModelId = "zyron";

export type ChatModel = {
  id: ChatModelId;
  label: string;
  description: string;
  agent: boolean;
};

export const CHAT_MODELS: ChatModel[] = [
  {
    id: "zyron",
    label: "Zyron",
    description: "AI workspace agent — память, tools, artifacts",
    agent: true,
  },
];

export const DEFAULT_CHAT_MODEL: ChatModelId = "zyron";

export function getChatModel(id: ChatModelId = DEFAULT_CHAT_MODEL): ChatModel {
  return CHAT_MODELS[0];
}
