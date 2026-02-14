import { NextRequest, NextResponse } from "next/server";

const DEFAULT_HUGGINGFACE_MODEL = "openai/gpt-oss-20b:fastest";
const HUGGINGFACE_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 600;

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type HuggingFaceChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function sanitizeHistory(input: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item): ChatHistoryMessage | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { role?: unknown; content?: unknown };
      const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : null;
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
      if (!role || !content) return null;

      return {
        role,
        content: content.slice(0, MAX_MESSAGE_LENGTH),
      };
    })
    .filter((item): item is ChatHistoryMessage => item !== null)
    .slice(-MAX_HISTORY_MESSAGES);
}

function fallbackTitle(messages: ChatHistoryMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user")?.content ?? "";
  const cleaned = firstUser
    .replace(/[`*_#|[\]{}()<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Chat";
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}...` : cleaned;
}

function normalizeTitle(raw: string): string {
  const cleaned = raw
    .replace(/[`*_#|[\]{}()<>]/g, " ")
    .replace(/^["'\-–—:\s]+|["'\-–—:\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Chat";

  const words = cleaned.split(" ").slice(0, 7);
  const capped = words.join(" ");
  return capped.length > 56 ? `${capped.slice(0, 56)}...` : capped;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const messages = sanitizeHistory(body?.messages);
    if (!messages.length) {
      return NextResponse.json({ title: "Chat" });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!apiKey) {
      return NextResponse.json({ title: fallbackTitle(messages) });
    }

    const model = process.env.HUGGINGFACE_MODEL || DEFAULT_HUGGINGFACE_MODEL;
    const convo = messages
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
      .join("\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(HUGGINGFACE_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: "system",
              content:
                "Generate a concise chat title from the conversation.\n" +
                "Rules:\n" +
                "- 2 to 6 words.\n" +
                "- English only.\n" +
                "- Sentence case.\n" +
                "- No quotes, no markdown, no trailing punctuation.\n" +
                "- Return title text only.",
            },
            {
              role: "user",
              content: `Conversation:\n${convo}\n\nTitle:`,
            },
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 24,
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ title: fallbackTitle(messages) });
      }

      const data = (await response.json()) as HuggingFaceChatResponse;
      const rawTitle = data.choices?.[0]?.message?.content ?? "";
      const title = normalizeTitle(rawTitle);
      return NextResponse.json({ title });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json({ title: "Chat" });
  }
}

