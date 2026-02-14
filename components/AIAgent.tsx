"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

const STORAGE_KEY = "taha-ai-panel-chat-sessions-v1";
const MAX_STORED_SESSIONS = 40;
const MAX_ATTACHMENTS = 5;
const DEFAULT_CHAT_TITLE_PREFIX = "Chat";
const DEFAULT_NEW_CHAT_TITLE = "New chat";

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

const INITIAL_ASSISTANT_MESSAGE = "Hello! How can I assist you today?";
const TEXT_PREVIEW_EXTENSIONS =
  /\.(txt|md|markdown|json|csv|ts|tsx|js|jsx|mjs|cjs|py|java|go|rb|php|html|css|scss|sql|xml|yml|yaml)$/i;
const MAX_TEXT_PREVIEW_FILE_SIZE = 300_000;
const MAX_TEXT_PREVIEW_CHARS = 2200;

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

const createInitialSession = (title: string = DEFAULT_NEW_CHAT_TITLE): ChatSession => {
  const now = Date.now();
  return {
    id: createId(),
    title,
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
        createdAt?: unknown;
        updatedAt?: unknown;
      };

      if (typeof candidate.id !== "string" || !candidate.id.trim()) return null;

      const title =
        typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : DEFAULT_NEW_CHAT_TITLE;
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

export default function AIAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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
  }, [messages, isLoading]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    []
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-panel-session-menu-root='true']")) return;
      setOpenSessionMenuId(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handleOpenAssistant: EventListener = () => {
      setIsOpen(true);
      setIsQuickActionsOpen(false);
    };

    window.addEventListener("open-ai-assistant", handleOpenAssistant);
    return () => {
      window.removeEventListener("open-ai-assistant", handleOpenAssistant);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscroll = documentElement.style.overscrollBehavior;

    if (isOpen) {
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      documentElement.style.overflow = "hidden";
      documentElement.style.overscrollBehavior = "none";
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [isOpen]);

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
    setIsQuickActionsOpen(false);
  };

  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setOpenSessionMenuId(null);
    setInput("");
    setPendingAttachments([]);
    setIsQuickActionsOpen(false);
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
      setOpenSessionMenuId(null);
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

  const sendMessage = async () => {
    const active = activeSession;
    if (!active || isLoading) return;

    const plainMessage = input.trim();
    const attachments = pendingAttachments;
    if (!plainMessage && !attachments.length) return;

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
      pushAssistantMessage(
        sessionIdAtSend,
        "Connection issue. Please try again or contact Taha at contact.devtaha@gmail.com."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const topButtonClass =
    "inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary border border-border text-foreground hover:border-primary/35 transition-colors";

  return (
    <>
      <motion.button
        id="ai-assistant"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 z-50 p-3.5 sm:p-4 rounded-full bg-primary text-secondary shadow-lg hover:shadow-xl transition-all"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle AI assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="fixed inset-x-2 bottom-3 z-50 h-[calc(100dvh-1.25rem)] max-h-[56rem] sm:inset-x-auto sm:right-3 sm:w-[28rem] md:w-[32rem] lg:w-[36rem] xl:w-[40rem] sm:top-6 sm:bottom-4 sm:h-auto rounded-[1.6rem] sm:rounded-[2.25rem] border border-border bg-card shadow-[0_35px_90px_-35px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden overscroll-contain"
          >
            <header className="px-4 sm:px-5 py-3.5">
              <div className="relative flex items-center justify-between">
                <button
                  className={topButtonClass}
                  onClick={() => setIsQuickActionsOpen((prev) => !prev)}
                  aria-label="Toggle quick actions"
                >
                  {isQuickActionsOpen ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                </button>

                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2">
                  <Image
                    src="/Logo.png"
                    alt="Taha Logo"
                    width={28}
                    height={28}
                    className="h-7 w-7 sm:h-8 sm:w-8 object-contain themed-logo"
                    priority
                  />
                  <p className="hidden sm:block text-xl font-semibold text-foreground text-center whitespace-nowrap">Taha Jameel</p>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    className={topButtonClass}
                    onClick={startNewChat}
                    aria-label="Start new chat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    className={topButtonClass}
                    onClick={() => {
                      setIsQuickActionsOpen(false);
                      setIsOpen(false);
                    }}
                    aria-label="Collapse panel"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            <div className="relative flex-1 min-h-0">
              <AnimatePresence>
                {isQuickActionsOpen && (
                  <>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsQuickActionsOpen(false)}
                      className="absolute inset-0 z-10 bg-black/12"
                      aria-label="Close quick actions"
                    />
                    <motion.aside
                      initial={{ x: -24, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -24, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 z-20 w-full max-w-[16.5rem] border-r border-border/70 bg-card/98 backdrop-blur-sm px-4 py-4 overflow-y-auto overscroll-contain"
                    >
                      <p className="text-xs tracking-wide text-muted-foreground uppercase">Quick Actions</p>
                      <button
                        type="button"
                        onClick={startNewChat}
                        className="mt-3 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-left text-foreground hover:border-primary/45 transition-colors"
                      >
                        <span className="inline-flex items-center gap-2 text-sm">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          Start chat
                        </span>
                      </button>

                      <p className="mt-5 text-xs tracking-wide text-muted-foreground uppercase">Conversations</p>
                      <div className="mt-2 space-y-2">
                        {sessions.map((session) => {
                          const active = session.id === activeSessionId;
                          return (
                            <div
                              key={session.id}
                              className={`w-full rounded-xl px-2.5 py-2 transition-colors ${
                                active
                                  ? "bg-secondary/90 text-foreground"
                                  : "bg-transparent text-foreground hover:bg-secondary/55"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => selectSession(session.id)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="text-sm truncate">{session.title}</p>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    {formatSessionUpdatedAt(session.updatedAt)}
                                  </p>
                                </button>
                                <div className="relative shrink-0 mt-0.5" data-panel-session-menu-root="true">
                                  <button
                                    type="button"
                                    aria-label={`Open actions for ${session.title}`}
                                    onClick={() =>
                                      setOpenSessionMenuId((prev) => (prev === session.id ? null : session.id))
                                    }
                                    className="w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/70 inline-flex items-center justify-center"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>

                                  {openSessionMenuId === session.id ? (
                                    <div className="absolute right-0 top-7 z-30 w-44 rounded-lg border border-border bg-card shadow-lg p-1.5">
                                      <p className="px-2 py-1 text-[10px] text-muted-foreground">
                                        Updated {formatSessionUpdatedAt(session.updatedAt)}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => deleteSession(session.id)}
                                        className="w-full rounded-md px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-secondary inline-flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                        Delete chat
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>

              <div className="h-full">
                <div className="h-full overflow-y-auto overscroll-contain px-4 sm:px-5 pt-4 pb-5 space-y-4">
                  {messages.map((msg, idx) => {
                    const isGreeting =
                      idx === 0 &&
                      msg.role === "assistant" &&
                      msg.content === INITIAL_ASSISTANT_MESSAGE &&
                      !msg.attachments?.length;

                    if (isGreeting) {
                      return (
                        <motion.p
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-base sm:text-xl leading-tight text-foreground/80 mt-6"
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
                          className={`max-w-[90%] sm:max-w-[88%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-primary text-secondary"
                              : "bg-secondary border border-border text-foreground"
                          }`}
                        >
                          {msg.content}
                          {msg.attachments?.length ? (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((attachment) => (
                                <p
                                  key={attachment.id}
                                  className={`text-[11px] ${msg.role === "user" ? "text-secondary/85" : "text-muted-foreground"}`}
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

                  {isLoading && (
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
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <footer className="px-4 sm:px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={onFilesSelected}
              />

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

              <div className="ai-input-shell rounded-full p-[1.2px]">
                <div className="rounded-full bg-card/95 border border-transparent px-4 py-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Attachment"
                    onClick={handleAttachmentClick}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-[15px] sm:text-lg leading-none focus:outline-none min-w-0"
                    maxLength={1200}
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    aria-label="Voice input"
                    onClick={toggleVoiceInput}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      isListening
                        ? "text-secondary bg-primary"
                        : "text-foreground/75 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    onClick={sendMessage}
                    disabled={isLoading || (!input.trim() && !pendingAttachments.length)}
                    className="w-8 h-8 rounded-full bg-primary text-secondary border border-primary/30 flex items-center justify-center disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                AI can make mistakes. Please double-check responses. Chats are saved on this browser.
              </p>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
