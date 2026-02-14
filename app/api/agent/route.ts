import { NextRequest, NextResponse } from "next/server";
import { serializeProfile } from "@/lib/agent/profile";
import { SYSTEM_PROMPT } from "@/lib/agent/prompt";
import { getClientIdentifier, isRateLimited } from "@/lib/agent/rateLimit";

const DEFAULT_HUGGINGFACE_MODEL = "openai/gpt-oss-20b:fastest";
const HUGGINGFACE_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 20_000;
const WEB_RESEARCH_TIMEOUT_MS = 6_000;
const MAX_WEB_SNIPPETS = 3;
const CONTACT_EMAIL = "contact.devtaha@gmail.com";
const CONTACT_WHATSAPP = "+92 336 8240877";

type QueryIntent = "portfolio" | "general";
type ResponseDepth = "brief" | "balanced" | "detailed";
type AssistantMode = "general" | "explain_topic" | "find_focus" | "practice";

const SMALL_TALK_PATTERNS = [
  /\b(hi|hello|hey|heyy|yo|sup|salam|assalam|assalamu\s*alaikum)\b/i,
  /\b(kaise ho|kese ho|kya haal|haal chal|how are you)\b/i,
];

const DETAILED_PATTERNS = [
  /\b(explain|detailed?|in detail|deep dive|step by step|roadmap|compare|comparison|difference|pros and cons|architecture)\b/i,
  /\b(why|how to|complete guide|all details|everything|break down|list all)\b/i,
];

const PORTFOLIO_PATTERNS = [
  /\b(taha|portfolio|resume|cv|hire|contact|email|whatsapp|linkedin|github)\b/i,
  /\b(skills?|projects?|experience|availability|services?|about|bio|summary)\b/i,
  /\b(matjar|pharmacy|pos)\b/i,
];

const PERSONAL_PROFILE_PATTERNS = [
  /\b(where\s+(does|do)?\s*(taha|he)\s*live(s)?|where\s+he\s+live(s)?)\b/i,
  /\b(where\s+is\s+he\s+from|where\s+are\s+you\s+from|location|city|country)\b/i,
  /\b(age|how\s+old|date\s+of\s+birth|dob|full\s+name|real\s+name)\b/i,
];

const PRONOUN_REFERENCE_PATTERNS = [/\b(he|his|him)\b/i, /\b(you|your)\b/i];

type HuggingFaceChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type ProviderResult =
  | { ok: true; response: string }
  | { ok: false; status: number; error: string; response: string };

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type AttachmentInput = {
  name: string;
  size: number;
  type: string;
  preview?: string;
};

type WebSnippet = {
  title: string;
  snippet: string;
  url: string;
};

function sanitizeAssistantMode(input: unknown): AssistantMode {
  if (input === "explain_topic" || input === "find_focus" || input === "practice") {
    return input;
  }
  return "general";
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

function sanitizeHistory(input: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(
      (item): item is { role: unknown; content: unknown } =>
        typeof item === "object" && item !== null && "role" in item && "content" in item
    )
    .map((item) => {
      const role = item.role === "assistant" ? "assistant" : item.role === "user" ? "user" : null;
      const content = typeof item.content === "string" ? item.content.trim() : "";
      if (!role || !content) return null;

      return {
        role,
        content: content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
      };
    })
    .filter((item): item is ChatHistoryMessage => item !== null)
    .slice(-MAX_HISTORY_MESSAGES);
}

function sanitizeAttachments(input: unknown): AttachmentInput[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item): AttachmentInput | null => {
      if (!item || typeof item !== "object") return null;

      const attachment = item as {
        name?: unknown;
        size?: unknown;
        type?: unknown;
        preview?: unknown;
      };

      if (typeof attachment.name !== "string" || !attachment.name.trim()) return null;

      return {
        name: attachment.name.trim().slice(0, 180),
        size:
          typeof attachment.size === "number" && Number.isFinite(attachment.size) && attachment.size >= 0
            ? attachment.size
            : 0,
        type: typeof attachment.type === "string" && attachment.type.trim()
          ? attachment.type.trim().slice(0, 120)
          : "application/octet-stream",
        preview:
          typeof attachment.preview === "string" && attachment.preview.trim()
            ? attachment.preview.trim().slice(0, 1800)
            : undefined,
      };
    })
    .filter((attachment): attachment is AttachmentInput => attachment !== null)
    .slice(0, 8);
}

function hasPortfolioContext(history: ChatHistoryMessage[]): boolean {
  if (!history.length) return false;
  return history.some((entry) => PORTFOLIO_PATTERNS.some((pattern) => pattern.test(entry.content)));
}

function inferQueryIntent(message: string, history: ChatHistoryMessage[]): QueryIntent {
  if (PORTFOLIO_PATTERNS.some((pattern) => pattern.test(message))) {
    return "portfolio";
  }

  if (PERSONAL_PROFILE_PATTERNS.some((pattern) => pattern.test(message))) {
    return "portfolio";
  }

  const hasPronounReference = PRONOUN_REFERENCE_PATTERNS.some((pattern) => pattern.test(message));
  if (hasPronounReference && hasPortfolioContext(history)) {
    return "portfolio";
  }

  return "general";
}

function getResearchTerms(message: string): string[] {
  const normalized = message.toLowerCase();
  const terms = new Set<string>();

  terms.add(message.trim());

  if (normalized.includes(" vs ")) {
    normalized
      .split(" vs ")
      .map((part) => part.replace(/[^\w\s#+.]/g, " ").trim())
      .filter((part) => part.length >= 3)
      .slice(0, 2)
      .forEach((part) => terms.add(part));
  }

  const betweenMatch = normalized.match(/difference between (.+?) and (.+?)(\?|$)/i);
  if (betweenMatch) {
    const left = betweenMatch[1]?.replace(/[^\w\s#+.]/g, " ").trim();
    const right = betweenMatch[2]?.replace(/[^\w\s#+.]/g, " ").trim();
    if (left && left.length >= 3) terms.add(left);
    if (right && right.length >= 3) terms.add(right);
  }

  return Array.from(terms).slice(0, MAX_WEB_SNIPPETS);
}

function cleanSnippetText(value: string): string {
  return value
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWikipediaTitle(term: string): Promise<string | null> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}` +
    "&limit=1&namespace=0&format=json&origin=*";

  try {
    const data = (await fetchJsonWithTimeout(url, WEB_RESEARCH_TIMEOUT_MS)) as unknown[];
    const titles = Array.isArray(data?.[1]) ? (data[1] as unknown[]) : [];
    const firstTitle = typeof titles[0] === "string" ? titles[0] : null;
    return firstTitle;
  } catch {
    return null;
  }
}

async function fetchWikipediaSnippet(title: string): Promise<WebSnippet | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const data = (await fetchJsonWithTimeout(url, WEB_RESEARCH_TIMEOUT_MS)) as {
      title?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };

    const snippet = typeof data.extract === "string" ? cleanSnippetText(data.extract) : "";
    if (!snippet) return null;

    return {
      title: typeof data.title === "string" ? data.title : title,
      snippet: snippet.slice(0, 420),
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

async function gatherWebResearchSnippets(message: string): Promise<WebSnippet[]> {
  const terms = getResearchTerms(message);
  const titles = await Promise.all(terms.map((term) => fetchWikipediaTitle(term)));
  const uniqueTitles = Array.from(new Set(titles.filter((title): title is string => Boolean(title)))).slice(
    0,
    MAX_WEB_SNIPPETS
  );

  if (!uniqueTitles.length) return [];

  const snippets = await Promise.all(uniqueTitles.map((title) => fetchWikipediaSnippet(title)));
  return snippets
    .filter((snippet): snippet is WebSnippet => snippet !== null)
    .slice(0, MAX_WEB_SNIPPETS);
}

function inferResponseDepth(message: string): ResponseDepth {
  const normalized = message.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean).length;
  const questionMarkCount = (normalized.match(/\?/g) ?? []).length;

  if (SMALL_TALK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "brief";
  }

  const asksForDetails = DETAILED_PATTERNS.some((pattern) => pattern.test(normalized));
  if (asksForDetails || questionMarkCount > 1 || words >= 18) {
    return "detailed";
  }

  return "balanced";
}

function isSmallTalk(message: string): boolean {
  const normalized = message.toLowerCase();
  return SMALL_TALK_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getDepthInstruction(responseDepth: ResponseDepth): string {
  if (responseDepth === "brief") {
    return "Respond briefly in 1-2 short sentences, but keep it complete.";
  }

  if (responseDepth === "detailed") {
    return "Provide a fuller, well-structured answer with enough practical detail.";
  }

  return "Respond with a concise but complete answer for a direct question.";
}

function getOutputTokenLimit(responseDepth: ResponseDepth): number {
  if (responseDepth === "brief") return 160;
  if (responseDepth === "detailed") return 560;
  return 340;
}

function getAssistantModeInstruction(mode: AssistantMode): string {
  if (mode === "explain_topic") {
    return (
      "Assistant mode is Explain Any Topic. " +
      "Teach step by step in simple language with numbered points and at least one practical example. " +
      "End with one short follow-up question asking what part the user wants next."
    );
  }

  if (mode === "find_focus") {
    return (
      "Assistant mode is Find My Focus. " +
      "Act like a practical mentor: ask clarifying questions, identify priorities, and suggest a focused next step plan. " +
      "Prefer concise, decision-oriented guidance."
    );
  }

  if (mode === "practice") {
    return (
      "Assistant mode is Practice With Me. " +
      "Run an interactive practice flow: ask one question at a time, wait for the user's answer, then provide brief feedback and next question. " +
      "Keep it engaging and structured."
    );
  }

  return "Assistant mode is General. Answer directly, clearly, and to the point.";
}

function createUserPrompt(
  intent: QueryIntent,
  message: string,
  responseDepth: ResponseDepth,
  smallTalkQuery: boolean,
  webSnippets: WebSnippet[],
  attachments: AttachmentInput[],
  assistantMode: AssistantMode
): string {
  const attachmentContext = attachments.length
    ? `Attached files: ${attachments
        .map((file) =>
          `${file.name} [${file.type}, ${file.size} bytes]${
            file.preview ? ` Preview: ${file.preview}` : " Preview: not provided."
          }`
        )
        .join("; ")}`
    : "Attached files: none";

  const sharedRules = [
    `Visitor question: ${message}`,
    `Response depth guidance: ${getDepthInstruction(responseDepth)}`,
    `Assistant mode guidance: ${getAssistantModeInstruction(assistantMode)}`,
    "Formatting requirement: Plain text only, no markdown tables, no pipe-separated formatting.",
    attachmentContext,
  ];

  if (intent === "portfolio") {
    const responseMode = smallTalkQuery
      ? "Portfolio mode with small-talk. Reply naturally in 1-2 short sentences."
      : "Portfolio mode. Answer with Taha profile details when relevant.";

    return [
      "Mode: Portfolio mode",
      "Profile data (source of truth for Taha-specific information):",
      serializeProfile(),
      "",
      ...sharedRules,
      `Response mode: ${responseMode}`,
      "If the user uses pronouns (he/his/him/you) in this conversation, resolve them to Taha when context is about the portfolio.",
      "Only share contact details when the user asks for contact or when required profile data is missing.",
      "If a resume link is asked and available in profile data, provide it directly.",
    ].join("\n");
  }

  const researchBlock = webSnippets.length
    ? [
        "Web research snippets (recently fetched; use when relevant):",
        ...webSnippets.map(
          (item, idx) => `[${idx + 1}] ${item.title}\nSnippet: ${item.snippet}\nSource: ${item.url}`
        ),
      ].join("\n\n")
    : "Web research snippets: not available for this query. Use strong general knowledge.";

  return [
    "Mode: General mode",
    ...sharedRules,
    "Answer the question directly and professionally.",
    "Do not mention Taha, portfolio contact details, or personal profile unless explicitly asked.",
    researchBlock,
  ].join("\n\n");
}

function normalizeAssistantResponse(rawText: string): string {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const cleanedLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/^#{1,6}\s*/, "")
      .trim();
    if (!line) {
      cleanedLines.push("");
      continue;
    }

    if (/^\|/.test(line)) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      if (!cells.length) continue;
      if (cells.every((cell) => /^[-:]+$/.test(cell))) continue;

      cleanedLines.push(`- ${cells.join(" - ")}`);
      continue;
    }

    cleanedLines.push(line);
  }

  const joined = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return joined;
}

function extractHuggingFaceError(rawBody: string): string | null {
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: string | { message?: string };
      message?: string;
    };

    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;

    if (
      typeof parsed.error === "object" &&
      parsed.error !== null &&
      typeof parsed.error.message === "string" &&
      parsed.error.message.trim()
    ) {
      return parsed.error.message;
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    return null;
  } catch {
    return null;
  }
}

async function generateWithHuggingFace({
  apiKey,
  model,
  prompt,
  history,
  maxTokens,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  history: ChatHistoryMessage[];
  maxTokens: number;
}): Promise<ProviderResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const huggingFaceResponse = await fetch(HUGGINGFACE_CHAT_URL, {
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
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((item) => ({ role: item.role, content: item.content })),
          { role: "user", content: prompt },
        ],
        temperature: 0.25,
        top_p: 0.9,
        max_tokens: maxTokens,
      }),
    });

    if (!huggingFaceResponse.ok) {
      const errorBody = await huggingFaceResponse.text();
      const parsedError = extractHuggingFaceError(errorBody);
      console.error("Hugging Face API error:", huggingFaceResponse.status, parsedError ?? errorBody);

      if (huggingFaceResponse.status === 429) {
        return {
          ok: false,
          status: 429,
          error: "AI usage limit reached.",
          response:
            `The AI assistant is temporarily at usage limit. Please try again shortly, or contact Taha at ${CONTACT_EMAIL}.`,
        };
      }

      return {
        ok: false,
        status: 502,
        error: "Failed to generate response.",
        response:
          `I could not process that right now. Please try again, or contact Taha at ${CONTACT_EMAIL}.`,
      };
    }

    const data = (await huggingFaceResponse.json()) as HuggingFaceChatResponse;
    const rawText = data.choices?.[0]?.message?.content?.trim() ?? "";
    const responseText = normalizeAssistantResponse(rawText);

    if (!responseText) {
      return {
        ok: false,
        status: 502,
        error: "Empty model response.",
        response:
          `I do not have that detail yet. Please contact Taha directly at ${CONTACT_EMAIL} or WhatsApp ${CONTACT_WHATSAPP}.`,
      };
    }

    return { ok: true, response: responseText };
  } catch (error) {
    console.error("Hugging Face request error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 504,
        error: "AI request timed out.",
        response:
          `The AI assistant took too long to respond. Please try again, or contact Taha at ${CONTACT_EMAIL}.`,
      };
    }

    return {
      ok: false,
      status: 502,
      error: "Failed to generate response.",
      response:
        `I could not process that right now. Please try again, or contact Taha at ${CONTACT_EMAIL}.`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(getClientIp(req));
    const rateLimit = isRateLimited(clientId);

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const history = sanitizeHistory(body?.history);
    const attachments = sanitizeAttachments(body?.attachments);
    const assistantMode = sanitizeAssistantMode(body?.assistantMode);

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "AI service is not configured.",
          response:
            `The AI assistant is currently unavailable. Please contact Taha at ${CONTACT_EMAIL} or WhatsApp ${CONTACT_WHATSAPP}.`,
        },
        { status: 500 }
      );
    }

    const intent = inferQueryIntent(message, history);
    const responseDepth = inferResponseDepth(message);
    const smallTalkQuery = isSmallTalk(message);

    let webSnippets: WebSnippet[] = [];
    if (intent === "general" && !smallTalkQuery) {
      try {
        webSnippets = await gatherWebResearchSnippets(message);
      } catch {
        webSnippets = [];
      }
    }

    const prompt = createUserPrompt(
      intent,
      message,
      responseDepth,
      smallTalkQuery,
      webSnippets,
      attachments,
      assistantMode
    );
    const result = await generateWithHuggingFace({
      apiKey,
      model: process.env.HUGGINGFACE_MODEL || DEFAULT_HUGGINGFACE_MODEL,
      prompt,
      history,
      maxTokens: getOutputTokenLimit(responseDepth),
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          response: result.response,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({ response: result.response });
  } catch (error) {
    console.error("Agent route error:", error);
    return NextResponse.json(
      {
        error: "Unexpected server error.",
        response:
          `Something went wrong. Please try again in a moment, or contact Taha directly at ${CONTACT_EMAIL}.`,
      },
      { status: 500 }
    );
  }
}
