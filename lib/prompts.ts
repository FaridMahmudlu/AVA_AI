import fs from "node:fs/promises";
import path from "node:path";

export type PromptConfig = {
  plan: {
    modelOrder: string[];
    system: string;
  };
  analyze: {
    modelOrder: string[];
    template: string;
  };
};

const PROMPTS_PATH = path.join(process.cwd(), "config", "prompts.json");

let cached: { value: PromptConfig; mtimeMs: number } | null = null;

export async function getPrompts(): Promise<PromptConfig> {
  const stat = await fs.stat(PROMPTS_PATH);
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.value;

  const raw = await fs.readFile(PROMPTS_PATH, "utf8");
  const parsed = JSON.parse(raw) as PromptConfig;
  cached = { value: parsed, mtimeMs: stat.mtimeMs };
  return parsed;
}

export async function savePrompts(next: PromptConfig): Promise<void> {
  // Minimal doğrulama
  if (
    !next?.plan?.system ||
    !Array.isArray(next?.plan?.modelOrder) ||
    !next?.analyze?.template ||
    !Array.isArray(next?.analyze?.modelOrder)
  ) {
    throw new Error("Gecersiz prompt yapisi.");
  }

  const json = JSON.stringify(next, null, 2);
  await fs.writeFile(PROMPTS_PATH, json, "utf8");
  const stat = await fs.stat(PROMPTS_PATH);
  cached = { value: next, mtimeMs: stat.mtimeMs };
}

// Basit template doldurucu: {{key}} ve {{#if transcript}} bloklarini destekler
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>,
) {
  const hasTranscript = Boolean(vars.transcript && String(vars.transcript).trim());
  let out = template;

  // {{#if key}} ... {{/if}}
  out = out.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_m, key, inner) => {
      const val = vars[key];
      const isTruthy = Boolean(val && String(val).trim());
      return isTruthy ? inner : "";
    },
  );

  // {{key}}
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });

  return out;
}

