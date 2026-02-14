"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  BookOpenText,
  BrainCircuit,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

const STORAGE_KEY = "taha-ai-workspace-chat-sessions-v1";
const LEGACY_STORAGE_KEY = "taha-ai-chat-sessions-v1";
const MAX_STORED_SESSIONS = 50;
const MAX_ATTACHMENTS = 5;
const DEFAULT_CHAT_TITLE_PREFIX = "Chat";
const DEFAULT_NEW_CHAT_TITLE = "New chat";

const INITIAL_ASSISTANT_MESSAGE = "Hello! How can I assist you today?";
const TEXT_PREVIEW_EXTENSIONS =
  /\.(txt|md|markdown|json|csv|ts|tsx|js|jsx|mjs|cjs|py|java|go|rb|php|html|css|scss|sql|xml|yml|yaml)$/i;
const MAX_TEXT_PREVIEW_FILE_SIZE = 300_000;
const MAX_TEXT_PREVIEW_CHARS = 2200;

type AssistantMode = "general" | "explain_topic" | "find_focus" | "practice";

type MessageAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  attachments?: MessageAttachment[];
};

type ChatSession = {
  id: string;
  title: string;
  mode: AssistantMode;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

type VoiceRecognitionResult = { transcript: string };
type VoiceRecognitionEvent = {
  results: ArrayLike<ArrayLike<VoiceRecognitionResult>>;
};
type VoiceRecognitionErrorEvent = {
  error?: string;
};
type VoiceRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type VoiceRecognitionConstructor = new () => VoiceRecognition;
type VoiceWindow = Window & {
  SpeechRecognition?: VoiceRecognitionConstructor;
  webkitSpeechRecognition?: VoiceRecognitionConstructor;
};

const MODE_LABELS: Record<AssistantMode, string> = {
  general: "General",
  explain_topic: "Explain Any Topic",
  find_focus: "Find My Focus",
  practice: "Practice With Me",
};

const MODE_CARDS: Array<{
  mode: AssistantMode;
  title: string;
  description: string;
  prompt: string;
  icon: typeof BookOpenText;
  gradient: string;
}> = [
  {
    mode: "explain_topic",
    title: "Explain Any Topic",
    description: "Understand any topic step by step with simple examples.",
    prompt: "Can you explain a topic step by step?",
    icon: BookOpenText,
    gradient: "from-amber-200 via-pink-400 to-fuchsia-500",
  },
  {
    mode: "find_focus",
    title: "Find my focus",
    description: "Get help deciding what to learn or work on next.",
    prompt: "Can you help me decide what to focus on?",
    icon: BrainCircuit,
    gradient: "from-sky-300 via-indigo-400 to-violet-500",
  },
  {
    mode: "practice",
    title: "Practice with me",
    description: "Test your knowledge through interactive problem-solving.",
    prompt: "Can you test my knowledge by asking a few practice questions?",
    icon: ClipboardCheck,
    gradient: "from-cyan-300 via-blue-400 to-indigo-500",
  },
];

const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createMessage = (
  role: ChatMessage["role"],
  content: string,
  attachments?: MessageAttachment[]
): ChatMessage => ({
  id: createId(),
  role,
  content,
  createdAt: Date.now(),
  attachments,
});

const isSystemGeneratedTitle = (title: string): boolean =>
  title === DEFAULT_NEW_CHAT_TITLE || new RegExp(`^${DEFAULT_CHAT_TITLE_PREFIX}\\s+\\d+$`).test(title);

const normalizeSessionTitles = (sessions: ChatSession[]): ChatSession[] => {
  return sessions.map((session) => {
    const trimmedTitle = session.title.trim();
    return {
      ...session,
      title: trimmedTitle || DEFAULT_NEW_CHAT_TITLE,
    };
  });
};

const createInitialSession = (title: string = DEFAULT_NEW_CHAT_TITLE, mode: AssistantMode = "general"): ChatSession => {
  const now = Date.now();
  return {
    id: createId(),
    title,
    mode,
    createdAt: now,
    updatedAt: now,
    messages: [createMessage("assistant", INITIAL_ASSISTANT_MESSAGE)],
  };
};

const sortSessions = (sessions: ChatSession[]): ChatSession[] =>
  [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

const toSessionTitle = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return DEFAULT_NEW_CHAT_TITLE;
  return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
};

const inferSessionTitleFromMessages = (messages: ChatMessage[]): string | null => {
  const firstUserMessage = messages.find((message) => message.role === "user")?.content ?? "";
  const normalized = firstUserMessage.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return toSessionTitle(normalized);
};

const toTitleHistoryPayload = (
  existingMessages: ChatMessage[],
  latestUserText: string,
  latestAssistantText: string
): Array<{ role: "user" | "assistant"; content: string }> => {
  const base = existingMessages
    .filter(
      (message, index) =>
        !(
          index === 0 &&
          message.role === "assistant" &&
          message.content === INITIAL_ASSISTANT_MESSAGE &&
          !message.attachments?.length
        )
    )
    .map((message) => ({ role: message.role, content: message.content }))
    .slice(-6);

  const next = [...base];
  if (latestUserText.trim()) {
    next.push({ role: "user", content: latestUserText.trim() });
  }
  if (latestAssistantText.trim()) {
    next.push({ role: "assistant", content: latestAssistantText.trim() });
  }

  return next.slice(-8);
};

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatSessionUpdatedAt = (timestamp: number): string =>
  new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const extractFilePreview = async (file: File): Promise<string | undefined> => {
  const lowerName = file.name.toLowerCase();
  const isTextLike = file.type.startsWith("text/") || TEXT_PREVIEW_EXTENSIONS.test(lowerName);
  if (!isTextLike || file.size > MAX_TEXT_PREVIEW_FILE_SIZE) return undefined;

  try {
    const raw = await file.text();
    const normalized = raw.replace(/\s+/g, " ").trim();
    return normalized ? normalized.slice(0, MAX_TEXT_PREVIEW_CHARS) : undefined;
  } catch {
    return undefined;
  }
};

const normalizeStoredSessions = (input: unknown): ChatSession[] => {
  if (!Array.isArray(input)) return [];

  const sessions = input
    .map((item): ChatSession | null => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as {
        id?: unknown;
        title?: unknown;
        messages?: unknown;
        mode?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
      };

      if (typeof candidate.id !== "string" || !candidate.id.trim()) return null;

      const title =
        typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : DEFAULT_NEW_CHAT_TITLE;
      const mode: AssistantMode =
        candidate.mode === "explain_topic" ||
        candidate.mode === "find_focus" ||
        candidate.mode === "practice"
          ? candidate.mode
          : "general";
      const messagesRaw = Array.isArray(candidate.messages) ? candidate.messages : [];
      const messages = messagesRaw
        .map((message): ChatMessage | null => {
          if (!message || typeof message !== "object") return null;
          const msg = message as {
            id?: unknown;
            role?: unknown;
            content?: unknown;
            createdAt?: unknown;
            attachments?: unknown;
          };

          const role = msg.role === "assistant" ? "assistant" : msg.role === "user" ? "user" : null;
          const content = typeof msg.content === "string" ? msg.content.trim() : "";
          if (!role || !content) return null;

          const attachmentRaw = Array.isArray(msg.attachments) ? msg.attachments : [];
          const attachments = attachmentRaw
            .map((attachment): MessageAttachment | null => {
              if (!attachment || typeof attachment !== "object") return null;
              const file = attachment as {
                id?: unknown;
                name?: unknown;
                size?: unknown;
                type?: unknown;
                preview?: unknown;
              };

              if (typeof file.name !== "string" || !file.name.trim()) return null;

              return {
                id: typeof file.id === "string" && file.id ? file.id : createId(),
                name: file.name,
                size: typeof file.size === "number" && Number.isFinite(file.size) ? file.size : 0,
                type: typeof file.type === "string" ? file.type : "application/octet-stream",
                preview:
                  typeof file.preview === "string" && file.preview.trim()
                    ? file.preview.slice(0, MAX_TEXT_PREVIEW_CHARS)
                    : undefined,
              };
            })
            .filter((attachment): attachment is MessageAttachment => Boolean(attachment));

          return {
            id: typeof msg.id === "string" && msg.id ? msg.id : createId(),
            role,
            content,
            createdAt:
              typeof msg.createdAt === "number" && Number.isFinite(msg.createdAt) ? msg.createdAt : Date.now(),
            attachments: attachments.length ? attachments : undefined,
          };
        })
        .filter((message): message is ChatMessage => Boolean(message));

      const safeMessages = messages.length ? messages : [createMessage("assistant", INITIAL_ASSISTANT_MESSAGE)];
      return {
        id: candidate.id,
        title,
        mode,
        messages: safeMessages,
        createdAt:
          typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt)
            ? candidate.createdAt
            : Date.now(),
        updatedAt:
          typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt)
            ? candidate.updatedAt
            : Date.now(),
      };
    })
    .filter((session): session is ChatSession => Boolean(session));

  return sortSessions(sessions).slice(0, MAX_STORED_SESSIONS);
};

export default function AIAssistantWorkspace() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );
  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession]);

  const showModeCards =
    messages.length === 1 &&
    messages[0]?.role === "assistant" &&
    messages[0]?.content === INITIAL_ASSISTANT_MESSAGE &&
    !messages[0]?.attachments?.length;
  const isWelcomeView = showModeCards;

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        const nextSession = createInitialSession();
        setSessions([nextSession]);
        setActiveSessionId(nextSession.id);
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeSessionTitles(normalizeStoredSessions(parsed)).map((session) => {
        if (!isSystemGeneratedTitle(session.title)) return session;
        const inferredTitle = inferSessionTitleFromMessages(session.messages);
        return inferredTitle ? { ...session, title: inferredTitle } : session;
      });
      if (!normalized.length) {
        const nextSession = createInitialSession();
        setSessions([nextSession]);
        setActiveSessionId(nextSession.id);
        return;
      }

      setSessions(normalized);
      setActiveSessionId(normalized[0].id);
    } catch {
      const nextSession = createInitialSession();
      setSessions([nextSession]);
      setActiveSessionId(nextSession.id);
    }
  }, []);

  useEffect(() => {
    if (!sessions.length || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_STORED_SESSIONS)));
  }, [sessions]);

  useEffect(() => {
    if (!sessions.length) return;
    if (!sessions.some((session) => session.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, showModeCards]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    []
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-session-menu-root='true']")) return;
      setOpenSessionMenuId(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const pushAssistantMessage = (sessionId: string, content: string) => {
    const assistantMessage = createMessage("assistant", content);
    setSessions((prev) =>
      sortSessions(
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : session
        )
      )
    );
  };

  const requestSmartTitle = async (
    conversation: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<string | null> => {
    if (!conversation.length) return null;

    try {
      const response = await fetch("/api/agent/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as { title?: unknown };
      if (typeof data?.title !== "string") return null;

      const suggested = data.title.replace(/\s+/g, " ").trim();
      if (!suggested) return null;
      return toSessionTitle(suggested);
    } catch {
      return null;
    }
  };

  const startNewChat = () => {
    const session = createInitialSession();
    setSessions((prev) => sortSessions([session, ...prev]).slice(0, MAX_STORED_SESSIONS));
    setActiveSessionId(session.id);
    setOpenSessionMenuId(null);
    setInput("");
    setPendingAttachments([]);
    setIsMobileSidebarOpen(false);
  };

  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setOpenSessionMenuId(null);
    setInput("");
    setPendingAttachments([]);
    setIsMobileSidebarOpen(false);
  };

  const deleteSession = (sessionId: string) => {
    const remaining = sortSessions(sessions.filter((session) => session.id !== sessionId)).slice(
      0,
      MAX_STORED_SESSIONS
    );

    if (!remaining.length) {
      const fallback = createInitialSession();
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
      setInput("");
      setPendingAttachments([]);
      return;
    }

    setSessions(remaining);
    setActiveSessionId((current) => (current === sessionId ? remaining[0].id : current));
    setOpenSessionMenuId(null);
    setInput("");
    setPendingAttachments([]);
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const enriched = await Promise.all(
      files.map(async (file) => ({
        id: createId(),
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        preview: await extractFilePreview(file),
      }))
    );

    setPendingAttachments((prev) => {
      const next = [...prev];
      for (const file of enriched) {
        if (next.length >= MAX_ATTACHMENTS) break;
        const duplicate = next.some(
          (entry) => entry.name === file.name && entry.size === file.size && entry.type === file.type
        );
        if (duplicate) continue;
        next.push(file);
      }
      return next;
    });

    event.target.value = "";
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    if (typeof window === "undefined") return;

    const voiceWindow = window as VoiceWindow;
    const RecognitionConstructor = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!RecognitionConstructor) {
      if (activeSessionId) {
        pushAssistantMessage(
          activeSessionId,
          "Voice input is not supported on this browser. Please use Chrome or Edge."
        );
      }
      return;
    }

    const recognition = new RecognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: VoiceRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const segment = event.results[i];
        if (segment?.[0]?.transcript) {
          transcript += ` ${segment[0].transcript}`;
        }
      }
      const normalized = transcript.trim();
      if (!normalized) return;
      setInput((prev) => (prev ? `${prev} ${normalized}` : normalized));
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const sendMessage = async (options?: {
    overrideText?: string;
    overrideMode?: AssistantMode;
  }) => {
    const active = activeSession;
    if (!active || isLoading) return;

    const plainMessage = (options?.overrideText ?? input).trim();
    const attachments = pendingAttachments;
    if (!plainMessage && !attachments.length) return;

    const nextMode = options?.overrideMode ?? active.mode;
    const attachmentHint = attachments.length
      ? `Attached files: ${attachments.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(", ")}`
      : "";
    const modelMessage = [plainMessage || "Please review the attached files.", attachmentHint]
      .filter(Boolean)
      .join("\n");

    const userMessage = createMessage("user", plainMessage || "Please review the attached files.", attachments);
    const history = active.messages
      .filter(
        (msg, idx) =>
          !(
            idx === 0 &&
            msg.role === "assistant" &&
            msg.content === INITIAL_ASSISTANT_MESSAGE &&
            !msg.attachments?.length
          )
      )
      .slice(-8)
      .map((msg) => ({ role: msg.role, content: msg.content }));
    history.push({ role: "user", content: modelMessage });

    const sessionIdAtSend = active.id;
    const hadSystemTitle = isSystemGeneratedTitle(active.title);
    const userTextForTitle = plainMessage || "File discussion";
    const immediateTitle = hadSystemTitle ? toSessionTitle(userTextForTitle) : active.title;

    setSessions((prev) =>
      sortSessions(
        prev.map((session) =>
          session.id === sessionIdAtSend
            ? {
                ...session,
                title: immediateTitle,
                mode: nextMode,
                messages: [...session.messages, userMessage],
                updatedAt: Date.now(),
              }
            : session
        )
      )
    );
    setInput("");
    setPendingAttachments([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: modelMessage,
          history,
          assistantMode: nextMode,
          attachments: attachments.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.preview,
          })),
        }),
      });

      const data = await res.json();
      const assistantText =
        typeof data?.response === "string" && data.response.trim()
          ? data.response
          : "I could not answer that right now. Please try again.";

      pushAssistantMessage(sessionIdAtSend, assistantText);

      if (hadSystemTitle) {
        const titleSource = toTitleHistoryPayload(active.messages, userTextForTitle, assistantText);
        void requestSmartTitle(titleSource).then((suggestedTitle) => {
          const nextTitle = suggestedTitle ?? toSessionTitle(userTextForTitle);
          if (!nextTitle) return;
          setSessions((prev) =>
            sortSessions(
              prev.map((session) => {
                if (session.id !== sessionIdAtSend) return session;
                if (!isSystemGeneratedTitle(session.title)) return session;
                return {
                  ...session,
                  title: nextTitle,
                  updatedAt: Date.now(),
                };
              })
            )
          );
        });
      }
    } catch {
      pushAssistantMessage(sessionIdAtSend, "Connection issue. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeCardClick = (mode: AssistantMode, prompt: string) => {
    void sendMessage({ overrideText: prompt, overrideMode: mode });
  };

  const sidebarBody = (
    <div className="h-full flex flex-col">
      <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center justify-between">
        {isSidebarOpen ? (
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Quick Actions</p>
        ) : (
          <span className="sr-only">Quick Actions</span>
        )}
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="w-7 h-7 rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground hover:-translate-y-[1px] hover:shadow-sm transition-all duration-200 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-2.5 py-2.5">
        <button
          type="button"
          onClick={startNewChat}
          className={`w-full rounded-xl border border-border bg-secondary hover:border-primary/35 hover:-translate-y-[1px] hover:shadow-sm transition-all duration-200 ${
            isSidebarOpen ? "px-2.5 py-1.5 text-left" : "py-1.5 inline-flex justify-center"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-foreground">
            <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
            {isSidebarOpen ? <span className="text-[15px]">Start chat</span> : null}
          </span>
        </button>
      </div>

      {isSidebarOpen ? (
        <div className="px-3.5 pb-3.5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Conversations</p>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1.5">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={`w-full rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-secondary/90 text-foreground shadow-[0_10px_24px_-22px_rgba(0,0,0,0.7)]"
                  : "bg-transparent text-foreground hover:bg-secondary/55 hover:-translate-y-[1px]"
              } ${isSidebarOpen ? "px-2.5 py-1.5 text-left" : "p-1.5 flex justify-center"}`}
            >
              {isSidebarOpen ? (
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => selectSession(session.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-[15px] truncate">{session.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{MODE_LABELS[session.mode]}</p>
                  </button>
                  <div className="relative shrink-0 mt-0.5" data-session-menu-root="true">
                    <button
                      type="button"
                      aria-label={`Open actions for ${session.title}`}
                      onClick={() =>
                        setOpenSessionMenuId((prev) => (prev === session.id ? null : session.id))
                      }
                      className="w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/70 hover:shadow-sm transition-all duration-200 inline-flex items-center justify-center"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {openSessionMenuId === session.id ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute right-0 top-7 z-30 w-44 rounded-lg border border-border bg-card shadow-lg p-1.5 backdrop-blur-sm"
                      >
                        <p className="px-2 py-1 text-[10px] text-muted-foreground">
                          Updated {formatSessionUpdatedAt(session.updatedAt)}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteSession(session.id)}
                          className="w-full rounded-md px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-secondary transition-colors inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          Delete chat
                        </button>
                      </motion.div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => selectSession(session.id)}
                  title={session.title}
                  className="w-full inline-flex items-center justify-center"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="h-[100dvh] min-h-[100svh] w-full bg-background text-foreground">
      <div className="h-full w-full overflow-hidden">
        <div className="h-full flex relative">
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="md:hidden absolute inset-0 z-20 bg-black/30"
                  aria-label="Close sidebar overlay"
                />
                <motion.aside
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="md:hidden absolute inset-y-0 left-0 z-30 w-[78vw] max-w-[18rem] border-r border-border bg-card"
                >
                  {sidebarBody}
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <aside
            className={`hidden md:block shrink-0 border-r border-border/70 transition-all duration-300 ${
              isSidebarOpen ? "w-[14rem]" : "w-[4.25rem]"
            }`}
          >
            {sidebarBody}
          </aside>

          <div className="flex-1 min-w-0 flex flex-col">
            <header className="md:hidden px-3.5 py-2.5 border-b border-border/60">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="w-9 h-9 rounded-full border border-border bg-secondary text-foreground hover:-translate-y-[1px] hover:shadow-sm transition-all duration-200 inline-flex items-center justify-center"
                  aria-label="Open quick actions"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
                <p className="text-sm font-medium text-foreground/85 truncate">AI Assistant</p>
                <span className="w-9 h-9" aria-hidden="true" />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-7 py-3">
              <div className="mx-auto w-full max-w-[52rem] space-y-2.5">
              {messages.map((msg, idx) => {
                const isGreeting =
                  idx === 0 &&
                  msg.role === "assistant" &&
                  msg.content === INITIAL_ASSISTANT_MESSAGE &&
                  !msg.attachments?.length;

                if (isGreeting) {
                  if (isWelcomeView) return null;
                  return (
                    <motion.p
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl sm:text-3xl leading-tight text-foreground/80 mt-3"
                    >
                      {msg.content}
                    </motion.p>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-xl px-3 py-2 text-[13px] leading-5 whitespace-pre-wrap transition-shadow duration-200 ${
                        msg.role === "user"
                          ? "bg-primary text-secondary shadow-[0_10px_24px_-20px_rgba(0,0,0,0.75)]"
                          : "bg-secondary border border-border text-foreground shadow-[0_10px_24px_-22px_rgba(0,0,0,0.55)]"
                      }`}
                    >
                      {msg.content}
                      {msg.attachments?.length ? (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((attachment) => (
                            <p
                              key={attachment.id}
                              className={`text-[11px] ${
                                msg.role === "user" ? "text-secondary/85" : "text-muted-foreground"
                              }`}
                            >
                              Attachment: {attachment.name} ({formatFileSize(attachment.size)})
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}

              {isWelcomeView ? (
                <div className="text-center pt-1.5 pb-1">
                  <div className="mx-auto mb-2.5 inline-flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-card p-1.5">
                    <Image
                      src="/Logo.png"
                      alt="Taha Logo"
                      width={104}
                      height={104}
                      className="relative h-full w-full -translate-x-[2px] -translate-y-[2px] rounded-full object-contain themed-logo"
                      priority
                    />
                  </div>
                  <h2 className="text-[1.45rem] sm:text-[2rem] leading-tight font-semibold text-foreground/75">
                    Hi, I am Taha Jameel
                  </h2>
                  <p className="mt-1 text-sm sm:text-base text-muted-foreground px-2">Full Stack Developer at Matjar X</p>
                </div>
              ) : null}

              {showModeCards ? (
                <div className="pt-1.5 space-y-3 max-w-[29rem] mx-auto px-0.5">
                  {MODE_CARDS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.mode}
                        type="button"
                        onClick={() => handleModeCardClick(item.mode, item.prompt)}
                        className={`w-full overflow-hidden text-left rounded-[1.1rem] border border-border bg-secondary/70 hover:border-primary/35 hover:-translate-y-[1px] hover:shadow-[0_14px_30px_-24px_rgba(0,0,0,0.7)] transition-all duration-200 ${
                          item.mode === "practice" ? "p-2 sm:p-2.5" : "p-2.5 sm:p-3"
                        } flex items-center gap-2.5`}
                      >
                        <span
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} text-white inline-flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[1.2rem] sm:text-[1.35rem] leading-tight font-semibold text-foreground">{item.title}</span>
                          <span className="block text-sm sm:text-base text-muted-foreground mt-0.5 pr-2 whitespace-normal sm:truncate">{item.description}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-secondary border border-border px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <span
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "130ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "260ms" }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="px-3 sm:px-5 lg:px-7 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-1.5">
              <input ref={fileInputRef} type="file" className="hidden" multiple onChange={onFilesSelected} />

              {pendingAttachments.length ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment) => (
                    <span
                      key={attachment.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-foreground"
                    >
                      <span className="truncate max-w-[11rem]">{attachment.name}</span>
                      <span className="text-muted-foreground">({formatFileSize(attachment.size)})</span>
                      <button
                        type="button"
                        aria-label={`Remove ${attachment.name}`}
                        onClick={() => removePendingAttachment(attachment.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="ai-input-shell rounded-full p-[1.2px] mx-auto max-w-[34rem] transition-all duration-200 focus-within:-translate-y-[1px]">
                <div className="rounded-full bg-card/95 border border-transparent px-2.5 sm:px-3 py-2.5 sm:py-3 flex items-center gap-1 sm:gap-1.5 transition-shadow duration-200 focus-within:shadow-[0_12px_30px_-24px_rgba(0,0,0,0.7)]">
                  <button
                    type="button"
                    aria-label="Attachment"
                    onClick={handleAttachmentClick}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full p-1 transition-all duration-200 shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-[14px] sm:text-[15px] leading-none focus:outline-none min-w-0"
                    maxLength={1200}
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    aria-label="Voice input"
                    onClick={toggleVoiceInput}
                    className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isListening
                        ? "text-secondary bg-primary"
                        : "text-foreground/75 hover:text-foreground hover:bg-secondary hover:shadow-sm"
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={isLoading || (!input.trim() && !pendingAttachments.length)}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-primary text-secondary border border-primary/30 flex items-center justify-center hover:-translate-y-[1px] hover:shadow-sm transition-all duration-200 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0 shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                AI can make mistakes. Please double-check responses. Chats are saved on this browser.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
