import type { Model } from "@nexu/shared";

export const PLATFORM_MODELS: Model[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    isDefault: true,
    description: "Recommended - best balance of speed and capability",
  },
  {
    id: "anthropic/claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    description: "Most capable - ideal for complex tasks",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI flagship model",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Lightweight and fast for simple tasks",
  },
];

export const PLATFORM_MODEL_CATALOG = Object.fromEntries(
  PLATFORM_MODELS.map((m) => [m.id, { alias: m.name }]),
);
