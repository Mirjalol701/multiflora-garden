import { loadEnvConfig } from "@next/env";
import fs from "fs";
import path from "path";

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function findProjectRoot(): string {
  let current = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, ".env"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

function readFileText(filePath: string): string {
  const raw = fs.readFileSync(filePath);
  if (raw.length >= 2 && raw[0] === 0xff && raw[1] === 0xfe) {
    return stripBom(raw.toString("utf16le"));
  }
  return stripBom(raw.toString("utf8"));
}

function parseEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnvFile(name: string): string | undefined {
  const root = findProjectRoot();
  const candidates = [
    path.join(root, ".env.local"),
    path.join(root, ".env"),
  ];

  for (const envPath of candidates) {
    try {
      const content = readFileText(envPath);
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = stripBom(trimmed.slice(0, eq).trim());
        if (key !== name) continue;
        const value = parseEnvValue(trimmed.slice(eq + 1));
        if (value) return value;
      }
    } catch {
      // try next candidate
    }
  }

  return undefined;
}

let envBootstrapped = false;

function bootstrapEnv(): void {
  if (envBootstrapped) return;
  loadEnvConfig(findProjectRoot(), process.env.NODE_ENV !== "production");
  envBootstrapped = true;
}

/** Read server env — prefers .env file over stale process.env (Next.js dev quirk). */
export function getServerEnv(name: string): string | undefined {
  bootstrapEnv();

  const fromFile = readEnvFile(name);
  if (fromFile) {
    process.env[name] = fromFile;
    return fromFile;
  }

  const fromProcess = process.env[name]?.trim();
  return fromProcess || undefined;
}
