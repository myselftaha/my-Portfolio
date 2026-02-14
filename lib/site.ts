import { PROFILE } from "@/lib/agent/profile";

function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

const deployedUrl =
  normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeBaseUrl(process.env.VERCEL_URL);

export const SITE_URL = deployedUrl ?? "http://localhost:3000";
export const SITE_NAME = "Taha Dev";
export const SITE_TITLE = `${PROFILE.identity.displayName} | Full Stack Developer`;
export const SITE_DESCRIPTION =
  "Taha Dev portfolio: Muhammad Taha (Taha Jameel), full stack developer from Karachi building fast Next.js, React, and Node.js web applications.";
export const SITE_KEYWORDS = [
  "Taha Dev",
  "Taha Jameel",
  "Muhammad Taha",
  "full stack developer",
  "Next.js developer",
  "React developer",
  "Node.js developer",
  "Karachi web developer",
  "Pakistan developer",
  "Taha Dev portfolio",
  "Taha Dev Vercel",
];

export function toAbsoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
