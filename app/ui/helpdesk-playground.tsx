"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { SessionSnapshot } from "@/lib/helpdesk";

type ApiResult = {
  status: number;
  payload: unknown;
};

type RequestOptions = RequestInit & {
  body?: BodyInit | null;
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  preview: string;
  timeLabel: string;
  unread?: number;
  muted?: boolean;
  avatarTone: string;
};

type ThreadMessage = {
  id: string;
  content: string;
  time: string;
  side: "incoming" | "outgoing";
  kind?: "text" | "audio";
  duration?: string;
};

type SidePanelView = "contact" | "profile";
type AuthMode = "login" | "register";
type LoginFormState = {
  username: string;
  password: string;
};
type RegisterFormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};
type AuthFeedback = {
  tone: "error" | "info" | "success";
  message: string;
};

const shellPanelClassName =
  "rounded-[34px] border border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,245,236,0.94))] shadow-[0_30px_90px_rgba(194,65,12,0.12)] backdrop-blur";
const inputClassName =
  "mt-2 w-full rounded-2xl border border-orange-200/80 bg-white/95 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-200/70";
const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(249,115,22,0.28)] transition hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-orange-200 bg-white/90 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60";

const conversations: Conversation[] = [
  {
    id: "elena",
    name: "Elena Vance",
    role: "Lead UI Architect",
    preview: "The citrus branding is looking sharp for the new dashboard.",
    timeLabel: "Just now",
    unread: 2,
    avatarTone: "from-orange-300 to-orange-600",
  },
  {
    id: "marcus",
    name: "Marcus Chen",
    role: "Product Design",
    preview: "I'll send the updated design tokens before the review.",
    timeLabel: "14:20",
    avatarTone: "from-stone-300 to-amber-700",
  },
  {
    id: "sarah",
    name: "Sarah Jenkins",
    role: "Project Ops",
    preview: "Attached: Final_Manifesto.pdf",
    timeLabel: "Yesterday",
    muted: true,
    avatarTone: "from-orange-200 to-amber-500",
  },
  {
    id: "design-ops",
    name: "Design Ops Team",
    role: "Internal group",
    preview: "You: Let's use the orange-centric style.",
    timeLabel: "Tuesday",
    avatarTone: "from-orange-200 to-orange-400",
  },
];

const fallbackMessages: ThreadMessage[] = [
  {
    id: "m1",
    content:
      "Hey! Have you had a chance to look at the new Helpdesk interface yet? I have already prepared the base structure for the chat workspace.",
    time: "10:45 AM",
    side: "incoming",
  },
  {
    id: "m2",
    content:
      "I just opened it. The orange-first direction works really well for a messaging product and keeps the layout energetic.",
    time: "10:47 AM",
    side: "outgoing",
  },
  {
    id: "m3",
    content: "Voice note preview",
    time: "10:48 AM",
    side: "incoming",
    kind: "audio",
    duration: "0:14",
  },
  {
    id: "m4",
    content:
      "Great. Next I want to keep the center thread clean and move the API controls into the details panel on the right side.",
    time: "10:50 AM",
    side: "outgoing",
  },
];

const sharedMedia = [
  "from-orange-300 via-orange-400 to-orange-500",
  "from-amber-300 via-orange-200 to-lime-200",
  "from-stone-200 via-orange-100 to-orange-300",
  "from-orange-100 to-orange-300",
];

const settingsItems = [
  {
    title: "Account",
    description: "Security notifications, change number, delete account",
  },
  {
    title: "Privacy",
    description: "Block lists, disappearing messages, status privacy",
  },
  {
    title: "Notifications",
    description: "Message, group & call tones, high priority previews",
  },
  {
    title: "Data and Storage",
    description: "Network usage, upload, download, storage management",
  },
  {
    title: "Help Center",
    description: "FAQ, contact support, privacy policy",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function findValueByKeys(payload: unknown, keys: string[]): string | number | null {
  const normalized = new Set(keys.map((key) => key.toLowerCase()));

  const visit = (value: unknown): string | number | null => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const match = visit(item);

        if (match !== null) {
          return match;
        }
      }

      return null;
    }

    if (!isRecord(value)) {
      return null;
    }

    for (const [key, nested] of Object.entries(value)) {
      if (
        normalized.has(key.toLowerCase()) &&
        (typeof nested === "string" || typeof nested === "number")
      ) {
        return nested;
      }
    }

    for (const nested of Object.values(value)) {
      const match = visit(nested);

      if (match !== null) {
        return match;
      }
    }

    return null;
  };

  return visit(payload);
}

function findArrayOfRecords(payload: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(payload)) {
    const records = payload.filter((item): item is Record<string, unknown> =>
      isRecord(item),
    );

    return records.length > 0 ? records : null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const value of Object.values(payload)) {
    const match = findArrayOfRecords(value);

    if (match) {
      return match;
    }
  }

  return null;
}

function formatMessageTime(record: Record<string, unknown>, fallback: string) {
  const raw =
    findValueByKeys(record, ["created_at", "time", "sent_at", "timestamp"]) ??
    fallback;

  if (typeof raw !== "string") {
    return fallback;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isOutgoingMessage(record: Record<string, unknown>) {
  const booleanCandidates = [
    record.is_mine,
    record.mine,
    record.is_from_me,
    record.outgoing,
  ];

  for (const candidate of booleanCandidates) {
    if (candidate === true) {
      return true;
    }

    if (candidate === false) {
      return false;
    }
  }

  const stringCandidates = [
    record.direction,
    record.sender_type,
    record.origin,
    record.source,
  ];

  for (const candidate of stringCandidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const normalized = candidate.toLowerCase();

    if (
      normalized.includes("out") ||
      normalized.includes("sent") ||
      normalized.includes("attend") ||
      normalized.includes("agent") ||
      normalized.includes("internal")
    ) {
      return true;
    }

    if (
      normalized.includes("in") ||
      normalized.includes("receive") ||
      normalized.includes("client") ||
      normalized.includes("customer")
    ) {
      return false;
    }
  }

  return false;
}

function normalizeMessages(payload: unknown): ThreadMessage[] {
  const source = isRecord(payload) && "data" in payload ? payload.data : payload;
  const records = findArrayOfRecords(source);

  if (!records) {
    return [];
  }

  return records
    .map((record, index) => {
      const content =
        findValueByKeys(record, ["message", "text", "body", "content"]) ?? "";

      if (typeof content !== "string" || !content.trim()) {
        return null;
      }

      return {
        id:
          String(
            findValueByKeys(record, ["id", "message_id", "uuid"]) ??
              `message-${index}`,
          ) || `message-${index}`,
        content,
        time: formatMessageTime(record, `${10 + index}:00 AM`),
        side: isOutgoingMessage(record) ? "outgoing" : "incoming",
      } satisfies ThreadMessage;
    })
    .filter((message): message is ThreadMessage => message !== null);
}

async function requestJson(url: string, init: RequestOptions = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function validateLoginForm(values: LoginFormState) {
  const errors: Record<string, string | undefined> = {};

  if (!values.username.trim()) {
    errors.username = "Informe seu usuario ou e-mail.";
  } else if (values.username.trim().length < 3) {
    errors.username = "Use pelo menos 3 caracteres.";
  }

  if (!values.password) {
    errors.password = "Informe sua senha.";
  } else if (values.password.length < 6) {
    errors.password = "A senha precisa ter pelo menos 6 caracteres.";
  }

  return errors;
}

function validateRegisterForm(values: RegisterFormState) {
  const errors: Record<string, string | undefined> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = values.phone.replace(/\D/g, "");

  if (!values.name.trim()) {
    errors.name = "Informe seu nome completo.";
  } else if (values.name.trim().length < 3) {
    errors.name = "Use pelo menos 3 caracteres no nome.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = "Digite um e-mail valido.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Informe seu telefone.";
  } else if (phoneDigits.length < 8) {
    errors.phone = "Digite um telefone valido.";
  }

  if (!values.password) {
    errors.password = "Crie uma senha.";
  } else if (values.password.length < 8) {
    errors.password = "A senha deve ter pelo menos 8 caracteres.";
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = "Use letras e numeros na senha.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirme sua senha.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "As senhas nao conferem.";
  }

  return errors;
}

function Glyph({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${
        active
          ? "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-700 shadow-[0_14px_28px_rgba(249,115,22,0.16)]"
          : "text-stone-500 hover:bg-orange-50 hover:text-orange-700"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SideIcon({ type }: { type: "chat" | "phone" | "stack" | "user" | "gear" | "avatar" }) {
  if (type === "chat") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 5h16v10H8l-4 4V5Z" />
        <path d="M8 9h8M8 12h6" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6.7 4h3l1 4-2 2a16 16 0 0 0 5.3 5.3l2-2 4 1v3A2 2 0 0 1 18 20C10.3 20 4 13.7 4 6a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (type === "stack") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h4v10H4zM10 5h4v14h-4zM16 7h4v10h-4z" />
      </svg>
    );
  }

  if (type === "user") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Z" />
      </svg>
    );
  }

  if (type === "gear") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="m19.4 13 .2-1-.2-1 2-1.5-2-3.4-2.3.7a7 7 0 0 0-1.7-1l-.4-2.4h-4l-.4 2.4a7 7 0 0 0-1.7 1l-2.3-.7-2 3.4L4.6 11l-.2 1 .2 1-2 1.5 2 3.4 2.3-.7c.5.4 1.1.7 1.7 1l.4 2.4h4l.4-2.4c.6-.3 1.2-.6 1.7-1l2.3.7 2-3.4L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
      </svg>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-100 text-sm font-semibold text-orange-700">
      U
    </div>
  );
}

function HeaderActionIcon({
  type,
}: {
  type: "video" | "phone" | "info";
}) {
  if (type === "video") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm14.5 3.2L22 7v10l-4.5-3.2V10.2Z" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.7 4h3l1 4-2 2a16 16 0 0 0 5.3 5.3l2-2 4 1v3A2 2 0 0 1 18 20C10.3 20 4 13.7 4 6a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm1 13h-2v-5h2Zm0-7h-2V7h2Z" />
    </svg>
  );
}

function ConversationItem({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full rounded-[30px] border p-4 text-left transition ${
        active
          ? "border-orange-200 bg-white shadow-[0_18px_40px_rgba(249,115,22,0.12)]"
          : "border-transparent bg-transparent hover:border-orange-100 hover:bg-white/85"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${conversation.avatarTone} text-lg font-semibold text-white`}
        >
          {getInitials(conversation.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-stone-950">
                {conversation.name}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-orange-600">
                {conversation.role}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                {conversation.timeLabel}
              </p>
              {conversation.unread ? (
                <span className="mt-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-orange-700 px-2 text-xs font-semibold text-white">
                  {conversation.unread}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="truncate text-sm text-stone-600">{conversation.preview}</p>
            {conversation.muted ? (
              <span className="h-4 w-4 rounded-full border border-stone-300 bg-stone-200" />
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  const outgoing = message.side === "outgoing";

  if (message.kind === "audio") {
    return (
      <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[82%]">
          <div className="rounded-[26px] bg-[#ffc58f] px-5 py-4 shadow-[0_18px_34px_rgba(251,146,60,0.18)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-orange-700 shadow-sm">
                <svg className="ml-1 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m8 5 11 7-11 7V5Z" />
                </svg>
              </div>
              <div className="flex items-end gap-1">
                {[14, 22, 30, 18, 26, 36, 20, 28, 14, 24, 16].map((height, index) => (
                  <span
                    className={`w-1.5 rounded-full ${index < 7 ? "bg-orange-700" : "bg-orange-300"}`}
                    key={`${message.id}-${height}`}
                    style={{ height }}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-stone-700">
                {message.duration ?? "0:14"}
              </span>
            </div>
          </div>
          <p className="mt-2 px-1 text-xs text-stone-500">{message.time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[86%]">
        <div
          className={`rounded-[26px] px-5 py-4 shadow-[0_18px_34px_rgba(0,0,0,0.06)] ${
            outgoing
              ? "bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 text-white"
              : "bg-[#ececec] text-stone-800"
          }`}
        >
          <p className="text-base leading-8">{message.content}</p>
        </div>
        <div
          className={`mt-2 flex items-center gap-2 px-1 text-xs text-stone-500 ${
            outgoing ? "justify-end" : "justify-start"
          }`}
        >
          <span>{message.time}</span>
          {outgoing ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-700 text-white">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="m9 16.2-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5L9 16.2Z" />
              </svg>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function PanelTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-gradient-to-r from-orange-700 to-orange-500 text-white shadow-[0_14px_24px_rgba(249,115,22,0.22)]"
          : "text-stone-500 hover:bg-orange-50 hover:text-orange-700"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SettingItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[24px] px-1 py-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
        </svg>
      </div>
      <div>
        <h4 className="text-base font-semibold text-stone-900">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
      </div>
    </div>
  );
}

function ContactPanel({
  activeConversation,
  onBack,
}: {
  activeConversation: Conversation;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-orange-700"
          onClick={onBack}
          type="button"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Messages
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-100 bg-white text-stone-500" type="button">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br ${activeConversation.avatarTone} text-3xl font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.18)]`}
        >
          {getInitials(activeConversation.name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-4xl font-semibold tracking-tight text-stone-950">
            {activeConversation.name}
          </h3>
          <p className="mt-2 text-sm font-semibold text-orange-700">
            Feeling like a freshly squeezed orange today
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className={primaryButtonClassName} type="button">
              Call
            </button>
            <button className={secondaryButtonClassName} type="button">
              Video
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white text-stone-500" type="button">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" />
              </svg>
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white text-stone-500" type="button">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8Z" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_1fr_220px]">
        <div className="rounded-[26px] bg-[linear-gradient(180deg,rgba(247,247,247,0.98),rgba(240,240,240,0.98))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
            About
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            UI designer by day, digital illustrator by night. Always chasing
            bright product surfaces and the best citrus palette for the next
            workspace.
          </p>
        </div>

        <div className="rounded-[26px] bg-[linear-gradient(180deg,rgba(247,247,247,0.98),rgba(240,240,240,0.98))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
            Mobile Number
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-stone-950">
            +1 (555) 892-0431
          </p>
          <p className="mt-2 text-sm text-stone-500">Seattle • USA</p>
        </div>

        <div className="rounded-[26px] bg-[linear-gradient(180deg,rgba(255,249,242,0.95),rgba(255,255,255,0.95))] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Shared Media
            </p>
            <button className="text-xs font-semibold text-orange-700" type="button">
              See all
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {sharedMedia.map((tone, index) => (
              <div
                className={`aspect-[1.15/0.9] rounded-[20px] bg-gradient-to-br ${tone}`}
                key={`${tone}-${index}`}
              />
            ))}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Recent Voice Notes
          </p>
          <div className="mt-3 rounded-[22px] bg-[#ffd0a8] px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-700">
                <svg className="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m8 5 11 7-11 7V5Z" />
                </svg>
              </div>
              <div className="flex items-end gap-1">
                {[8, 14, 18, 12, 16, 10, 15].map((height) => (
                  <span
                    className="w-1.5 rounded-full bg-orange-700"
                    key={`${height}`}
                    style={{ height }}
                  />
                ))}
              </div>
              <span className="ml-auto text-sm font-semibold text-stone-700">0:24</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyProfilePanel({
  session,
  notice,
  loginForm,
  setLoginForm,
  handleLogin,
  handleLogout,
  busyAction,
  clientForm,
  setClientForm,
  handleRegisterClient,
  chatSeedForm,
  setChatSeedForm,
  handleBootstrapChat,
  loginResult,
  registerResult,
  bootstrapResult,
  messagesResult,
  sendResult,
}: {
  session: SessionSnapshot;
  notice: string | null;
  loginForm: { username: string; password: string };
  setLoginForm: Dispatch<SetStateAction<{ username: string; password: string }>>;
  handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleLogout: () => Promise<void>;
  busyAction: string | null;
  clientForm: {
    externalId: string;
    name: string;
    nickname: string;
    contactType: string;
    contactValue: string;
    externalContactId: string;
  };
  setClientForm: Dispatch<
    SetStateAction<{
      externalId: string;
      name: string;
      nickname: string;
      contactType: string;
      contactValue: string;
      externalContactId: string;
    }>
  >;
  handleRegisterClient: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  chatSeedForm: { from: string; senderName: string; message: string };
  setChatSeedForm: Dispatch<
    SetStateAction<{
      from: string;
      senderName: string;
      message: string;
    }>
  >;
  handleBootstrapChat: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  loginResult: ApiResult | null;
  registerResult: ApiResult | null;
  bootstrapResult: ApiResult | null;
  messagesResult: ApiResult | null;
  sendResult: ApiResult | null;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,249,243,0.95),rgba(255,255,255,0.98))] p-5 text-center">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-[34px] bg-gradient-to-br from-stone-200 to-orange-100 text-4xl font-semibold text-stone-700">
            JV
          </div>
          <h3 className="mt-5 text-3xl font-semibold tracking-tight text-stone-950">
            Meu Perfil
          </h3>
          <p className="mt-2 text-sm text-stone-500">@kinetic_citrus</p>
          <button className={`${primaryButtonClassName} mt-5 w-full`} type="button">
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-[24px] bg-[#fff1e2] px-4 py-5 text-center">
            <p className="text-3xl font-semibold text-stone-950">1,284</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Contacts
            </p>
          </div>
          <div className="rounded-[24px] bg-[#ffe0d4] px-4 py-5 text-center">
            <p className="text-3xl font-semibold text-stone-950">42</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Groups
            </p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-900">Voice Bio</p>
            <span className="text-xs text-stone-400">0:14</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
              <svg className="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="m8 5 11 7-11 7V5Z" />
              </svg>
            </div>
            <div className="flex flex-1 items-end gap-1">
              {[4, 8, 10, 16, 9, 6, 11, 14, 8].map((height, index) => (
                <span
                  className={`w-2 rounded-full ${index % 2 === 0 ? "bg-orange-200" : "bg-orange-700"}`}
                  key={`${height}-${index}`}
                  style={{ height }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] bg-white/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <h3 className="text-4xl font-semibold tracking-tight text-stone-950">
          Settings
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
          Fine-tune your messaging experience and manage your Helpdesk API test
          flows from a single profile workspace.
        </p>

        <div className="mt-8 space-y-3">
          {settingsItems.map((item) => (
            <SettingItem
              description={item.description}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>

        {notice ? (
          <div className="mt-6 rounded-[22px] border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            {notice}
          </div>
        ) : null}

        <div className="mt-8 space-y-4 border-t border-orange-100 pt-6">
          <details className="rounded-[24px] border border-orange-200 bg-[#fffaf5] p-4" open>
            <summary className="cursor-pointer list-none text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
              Authentication
            </summary>
            <form className="mt-4 grid gap-4" onSubmit={handleLogin}>
              <Field label="Username">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  value={loginForm.username}
                />
              </Field>
              <Field label="Password">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  type="password"
                  value={loginForm.password}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <button
                  className={primaryButtonClassName}
                  disabled={busyAction === "login"}
                  type="submit"
                >
                  {busyAction === "login" ? "Signing in..." : "Login"}
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "logout" || !session.authenticated}
                  onClick={() => {
                    void handleLogout();
                  }}
                  type="button"
                >
                  {busyAction === "logout" ? "Closing..." : "Logout"}
                </button>
              </div>
            </form>
          </details>

          <details className="rounded-[24px] border border-orange-200 bg-[#fffaf5] p-4">
            <summary className="cursor-pointer list-none text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
              Register client
            </summary>
            <form className="mt-4 grid gap-4" onSubmit={handleRegisterClient}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="External ID">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        externalId: event.target.value,
                      }))
                    }
                    value={clientForm.externalId}
                  />
                </Field>
                <Field label="Client name">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    value={clientForm.name}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nickname">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        nickname: event.target.value,
                      }))
                    }
                    value={clientForm.nickname}
                  />
                </Field>
                <Field label="Contact type">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        contactType: event.target.value,
                      }))
                    }
                    value={clientForm.contactType}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contact value">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        contactValue: event.target.value,
                      }))
                    }
                    value={clientForm.contactValue}
                  />
                </Field>
                <Field label="External contact ID">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        externalContactId: event.target.value,
                      }))
                    }
                    value={clientForm.externalContactId}
                  />
                </Field>
              </div>
              <button
                className={primaryButtonClassName}
                disabled={busyAction === "register" || !session.authenticated}
                type="submit"
              >
                {busyAction === "register" ? "Sending..." : "Create client"}
              </button>
            </form>
          </details>

          <details className="rounded-[24px] border border-orange-200 bg-[#fffaf5] p-4">
            <summary className="cursor-pointer list-none text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
              Webhook seed
            </summary>
            <form className="mt-4 grid gap-4" onSubmit={handleBootstrapChat}>
              <Field label="From">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setChatSeedForm((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                  value={chatSeedForm.from}
                />
              </Field>
              <Field label="Sender">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setChatSeedForm((current) => ({
                      ...current,
                      senderName: event.target.value,
                    }))
                  }
                  value={chatSeedForm.senderName}
                />
              </Field>
              <Field label="Initial message">
                <textarea
                  className={`${inputClassName} min-h-28 resize-y`}
                  onChange={(event) =>
                    setChatSeedForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  value={chatSeedForm.message}
                />
              </Field>
              <button
                className={primaryButtonClassName}
                disabled={busyAction === "bootstrap"}
                type="submit"
              >
                {busyAction === "bootstrap" ? "Creating..." : "Create chat"}
              </button>
            </form>
          </details>

          <details className="rounded-[24px] border border-orange-200 bg-[#fffaf5] p-4">
            <summary className="cursor-pointer list-none text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
              API responses
            </summary>
            <div className="mt-4 space-y-4">
              <JsonPanel title="Authentication" result={loginResult} />
              <JsonPanel title="Register client" result={registerResult} />
              <JsonPanel title="Webhook seed" result={bootstrapResult} />
              <JsonPanel title="Messages" result={messagesResult} />
              <JsonPanel title="Send message" result={sendResult} />
            </div>
          </details>
        </div>

        <button
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-700"
          onClick={() => {
            void handleLogout();
          }}
          type="button"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 17v-2H3V9h7V7l4 5-4 5Zm5 3H7v-2h8V6H7V4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z" />
          </svg>
          Sign Out from workspace
        </button>
      </div>
    </div>
  );
}

function JsonPanel({
  title,
  result,
}: {
  title: string;
  result: ApiResult | null;
}) {
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-orange-400/20 bg-[linear-gradient(180deg,#2b1406,#130d0a)] p-4 text-xs text-stone-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <strong className="text-[0.7rem] uppercase tracking-[0.22em] text-orange-200">
          {title}
        </strong>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] tracking-[0.18em] text-stone-300 uppercase">
          HTTP {result.status}
        </span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(result.payload, null, 2)}
      </pre>
    </div>
  );
}

function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          {label}
        </span>
        {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
      </div>
      {children}
    </label>
  );
}

function AuthScreen({
  mode,
  setMode,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  loginErrors,
  registerErrors,
  feedback,
  busyAction,
  onLogin,
  onRegister,
}: {
  mode: AuthMode;
  setMode: Dispatch<SetStateAction<AuthMode>>;
  loginForm: LoginFormState;
  setLoginForm: Dispatch<SetStateAction<LoginFormState>>;
  registerForm: RegisterFormState;
  setRegisterForm: Dispatch<SetStateAction<RegisterFormState>>;
  loginErrors: Record<string, string | undefined>;
  registerErrors: Record<string, string | undefined>;
  feedback: AuthFeedback | null;
  busyAction: string | null;
  onLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRegister: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const isLogin = mode === "login";
  const feedbackClassName =
    feedback?.tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : feedback?.tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-orange-200 bg-orange-50 text-orange-800";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1320px] flex-1 items-center px-3 py-3 sm:px-5 sm:py-5">
      <section className="grid w-full overflow-hidden rounded-[34px] border border-orange-200/60 bg-white shadow-[0_40px_120px_rgba(194,65,12,0.14)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#c75b14_0%,#f97316_55%,#ff7a1a_100%)] px-8 py-10 text-white sm:px-12 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.16),transparent_38%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">Citrus Pulse</p>
            </div>

            <div className="max-w-md py-10 lg:py-0">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-100/85">
                Messaging Platform
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                The Living Pulse of Conversation.
              </h1>
              <p className="mt-5 text-base leading-8 text-orange-50/92">
                Experience messaging that breathes with the energy of real-time
                connection and a clean citrus-first interface.
              </p>

              <div className="mt-8 rounded-[24px] border border-white/12 bg-white/12 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm1 5v3h3v2h-3v3h-2v-3H8v-2h3V8Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">Fluid Interface</p>
                    <p className="text-sm text-orange-50/80">
                      Redefining digital atmosphere.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden text-sm text-orange-100/70 lg:block">
              Secure BFF login • Cookie session • API-first testing
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-14">
          <div className="w-full max-w-[440px]">
            <div className="rounded-full bg-stone-100 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                    isLogin
                      ? "bg-white text-stone-950 shadow-sm"
                      : "text-stone-500 hover:text-orange-700"
                  }`}
                  onClick={() => setMode("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                    !isLogin
                      ? "bg-white text-stone-950 shadow-sm"
                      : "text-stone-500 hover:text-orange-700"
                  }`}
                  onClick={() => setMode("register")}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-4xl font-semibold tracking-tight text-stone-950">
                {isLogin ? "Welcome back." : "Create account."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                {isLogin
                  ? "Please enter your details to sign in."
                  : "Preencha seus dados. O frontend valida o fluxo, mas a API atual nao expõe uma rota publica de cadastro."}
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-500"
                type="button"
              >
                Google
              </button>
              <button
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-500"
                type="button"
              >
                Apple
              </button>
            </div>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-stone-400">
                Or {isLogin ? "email" : "start here"}
              </span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            {feedback ? (
              <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${feedbackClassName}`}>
                {feedback.message}
              </div>
            ) : null}

            {isLogin ? (
              <form className="space-y-4" onSubmit={onLogin}>
                <AuthField error={loginErrors.username} label="Username or email">
                  <input
                    className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                    value={loginForm.username}
                  />
                </AuthField>

                <AuthField error={loginErrors.password} label="Password">
                  <div>
                    <div className="mb-2 flex justify-end">
                      <button className="text-xs font-semibold text-orange-700" type="button">
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      type="password"
                      value={loginForm.password}
                    />
                  </div>
                </AuthField>

                <button
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-700 to-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(249,115,22,0.28)] transition hover:from-orange-800 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busyAction === "login"}
                  type="submit"
                >
                  {busyAction === "login" ? "Logging in..." : "Log in"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={onRegister}>
                <AuthField error={registerErrors.name} label="Full name">
                  <input
                    className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Julia Thorn"
                    value={registerForm.name}
                  />
                </AuthField>
                <AuthField error={registerErrors.email} label="Email">
                  <input
                    className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                    value={registerForm.email}
                  />
                </AuthField>
                <AuthField error={registerErrors.phone} label="Phone">
                  <input
                    className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+55 11 99999-9999"
                    value={registerForm.phone}
                  />
                </AuthField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthField error={registerErrors.password} label="Password">
                    <input
                      className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Create password"
                      type="password"
                      value={registerForm.password}
                    />
                  </AuthField>
                  <AuthField
                    error={registerErrors.confirmPassword}
                    label="Confirm password"
                  >
                    <input
                      className="w-full rounded-2xl bg-stone-100 px-4 py-3.5 text-sm text-stone-900 outline-none ring-1 ring-transparent transition placeholder:text-stone-400 focus:bg-white focus:ring-orange-300"
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Repeat password"
                      type="password"
                      value={registerForm.confirmPassword}
                    />
                  </AuthField>
                </div>

                <button
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-700 to-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(249,115,22,0.28)] transition hover:from-orange-800 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busyAction === "register-auth"}
                  type="submit"
                >
                  {busyAction === "register-auth"
                    ? "Validating..."
                    : "Create account"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-stone-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                className="font-semibold text-orange-700"
                onClick={() => setMode(isLogin ? "register" : "login")}
                type="button"
              >
                {isLogin ? "Create one now" : "Back to login"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HelpdeskPlayground({
  initialSession,
}: {
  initialSession: SessionSnapshot;
}) {
  const [session, setSession] = useState<SessionSnapshot>(initialSession);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeConversationId, setActiveConversationId] = useState("elena");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidePanelView, setSidePanelView] = useState<SidePanelView>("contact");

  const [loginForm, setLoginForm] = useState<LoginFormState>({
    username: "customer@example.com",
    password: "password123",
  });
  const [registerAuthForm, setRegisterAuthForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [clientForm, setClientForm] = useState({
    externalId: "client-demo-001",
    name: "Cliente Teste",
    nickname: "compras",
    contactType: "whatsapp",
    contactValue: "5511999999999",
    externalContactId: "contact-demo-001",
  });
  const [chatSeedForm, setChatSeedForm] = useState({
    from: "5511999999999",
    senderName: "Cliente WhatsApp",
    message: "Mensagem inicial criada pela interface de teste.",
  });
  const [chatForm, setChatForm] = useState({
    chatId: "",
    participantIds: "",
    outboundMessage:
      "Estou validando o consumo da API por este novo layout de mensagens.",
    channel: "web",
    type: "text",
  });

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback | null>(null);
  const [loginErrors, setLoginErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [registerErrors, setRegisterErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [loginResult, setLoginResult] = useState<ApiResult | null>(null);
  const [registerResult, setRegisterResult] = useState<ApiResult | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<ApiResult | null>(null);
  const [messagesResult, setMessagesResult] = useState<ApiResult | null>(null);
  const [sendResult, setSendResult] = useState<ApiResult | null>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ??
    conversations[0];

  const filteredConversations = conversations.filter((conversation) => {
    const haystack = `${conversation.name} ${conversation.preview} ${conversation.role}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const normalizedMessages = normalizeMessages(messagesResult?.payload);
  const threadMessages =
    normalizedMessages.length > 0 ? normalizedMessages : fallbackMessages;

  async function loadSession() {
    const result = await requestJson("/api/session");

    if (result.ok && isRecord(result.payload)) {
      setSession(result.payload as SessionSnapshot);
      setNotice(
        typeof result.payload.error === "string" ? result.payload.error : null,
      );
      setAuthFeedback(null);
    } else {
      setSession(initialSession);
      setNotice("Nao foi possivel consultar a sessao atual.");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginForm(loginForm);
    setLoginErrors(nextErrors);
    setAuthFeedback(null);

    if (hasErrors(nextErrors)) {
      return;
    }

    setBusyAction("login");
    setNotice(null);

    const result = await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginForm.username,
        password: loginForm.password,
      }),
    });

    setLoginResult({
      status: result.status,
      payload: result.payload,
    });

    if (result.ok) {
      setLoginErrors({});
      setNotice("Login realizado. A sessao foi salva em cookie httpOnly.");
      await loadSession();
    } else if (isRecord(result.payload) && typeof result.payload.message === "string") {
      setAuthFeedback({
        tone: "error",
        message: result.payload.message,
      });
      setNotice(result.payload.message);
    } else {
      setAuthFeedback({
        tone: "error",
        message: "Falha ao autenticar. Revise suas credenciais.",
      });
      setNotice("Falha ao autenticar.");
    }

    setBusyAction(null);
  }

  async function handleRegisterAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegisterForm(registerAuthForm);
    setRegisterErrors(nextErrors);
    setAuthFeedback(null);

    if (hasErrors(nextErrors)) {
      return;
    }

    setBusyAction("register-auth");

    const result = await requestJson("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: registerAuthForm.name,
        email: registerAuthForm.email,
        phone: registerAuthForm.phone,
        password: registerAuthForm.password,
      }),
    });

    if (isRecord(result.payload) && typeof result.payload.message === "string") {
      setAuthFeedback({
        tone:
          result.status === 501
            ? "info"
            : result.ok
              ? "success"
              : "error",
        message: result.payload.message,
      });
    } else {
      setAuthFeedback({
        tone: "error",
        message: "Nao foi possivel processar o cadastro.",
      });
    }

    setBusyAction(null);
  }

  async function handleLogout() {
    setBusyAction("logout");
    setNotice(null);

    const result = await requestJson("/api/auth/logout", {
      method: "POST",
    });

    setLoginResult({
      status: result.status,
      payload: result.payload,
    });
    setMessagesResult(null);
    setSendResult(null);
    setRegisterResult(null);
    setAuthMode("login");
    setAuthFeedback({
      tone: "info",
      message: "Sessao encerrada. Faca login novamente para continuar.",
    });
    await loadSession();
    setNotice("Sessao encerrada.");
    setBusyAction(null);
  }

  async function handleRegisterClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("register");
    setNotice(null);

    const result = await requestJson("/api/clients/register", {
      method: "POST",
      body: JSON.stringify({
        external_id: clientForm.externalId,
        name: clientForm.name,
        nickname: clientForm.nickname,
        contact_type: clientForm.contactType,
        contact_value: clientForm.contactValue,
        external_contact_id: clientForm.externalContactId,
      }),
    });

    setRegisterResult({
      status: result.status,
      payload: result.payload,
    });

    if (isRecord(result.payload) && typeof result.payload.message === "string") {
      setNotice(result.payload.message);
    }

    setBusyAction(null);
  }

  async function handleBootstrapChat(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusyAction("bootstrap");
    setNotice(null);

    const result = await requestJson("/api/chats/bootstrap", {
      method: "POST",
      body: JSON.stringify(chatSeedForm),
    });

    setBootstrapResult({
      status: result.status,
      payload: result.payload,
    });

    if (result.ok) {
      const payload = isRecord(result.payload) ? result.payload.data : null;
      const chatId = findValueByKeys(payload, ["chat_id", "chatId"]);
      const participantId = findValueByKeys(payload, [
        "participant_id",
        "participantId",
      ]);

      setChatForm((current) => ({
        ...current,
        chatId: chatId ? String(chatId) : current.chatId,
        participantIds: participantId
          ? String(participantId)
          : current.participantIds,
      }));
    }

    if (isRecord(result.payload) && typeof result.payload.message === "string") {
      setNotice(result.payload.message);
    }

    setBusyAction(null);
  }

  async function handleLoadMessages() {
    if (!chatForm.chatId.trim()) {
      setNotice("Informe um chat_id para listar as mensagens.");
      return;
    }

    setBusyAction("messages");
    setNotice(null);

    const result = await requestJson(
      `/api/messages?chatId=${encodeURIComponent(chatForm.chatId.trim())}`,
    );

    setMessagesResult({
      status: result.status,
      payload: result.payload,
    });

    if (isRecord(result.payload) && typeof result.payload.message === "string") {
      setNotice(result.payload.message);
    }

    setBusyAction(null);
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("send");
    setNotice(null);

    const participantIds = chatForm.participantIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const result = await requestJson("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        message: chatForm.outboundMessage,
        channel: chatForm.channel,
        type: chatForm.type,
        participant_ids: participantIds,
      }),
    });

    setSendResult({
      status: result.status,
      payload: result.payload,
    });

    if (result.ok) {
      await handleLoadMessages();
      setChatForm((current) => ({
        ...current,
        outboundMessage: "",
      }));
    }

    if (isRecord(result.payload) && typeof result.payload.message === "string") {
      setNotice(result.payload.message);
    }

    setBusyAction(null);
  }

  if (!session.authenticated) {
    return (
      <AuthScreen
        busyAction={busyAction}
        feedback={authFeedback}
        loginErrors={loginErrors}
        loginForm={loginForm}
        mode={authMode}
        onLogin={handleLogin}
        onRegister={handleRegisterAuth}
        registerErrors={registerErrors}
        registerForm={registerAuthForm}
        setLoginForm={setLoginForm}
        setMode={setAuthMode}
        setRegisterForm={setRegisterAuthForm}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-3 py-3 sm:px-5 sm:py-5">
      <div className="grid flex-1 gap-4 xl:grid-cols-[88px_360px_minmax(0,1fr)_320px]">
        <aside className={`hidden xl:flex xl:flex-col xl:items-center xl:justify-between xl:px-4 xl:py-6 ${shellPanelClassName}`}>
          <div className="flex flex-col items-center gap-8">
            <div className="text-2xl font-semibold text-orange-700">K.</div>
            <div className="flex flex-col items-center gap-5">
              <Glyph active>
                <SideIcon type="chat" />
              </Glyph>
              <Glyph>
                <SideIcon type="phone" />
              </Glyph>
              <Glyph>
                <SideIcon type="stack" />
              </Glyph>
              <Glyph
                active={sidePanelView === "profile"}
                onClick={() => setSidePanelView("profile")}
              >
                <SideIcon type="user" />
              </Glyph>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <Glyph onClick={() => setSidePanelView("profile")}>
              <SideIcon type="gear" />
            </Glyph>
            <Glyph>
              <SideIcon type="avatar" />
            </Glyph>
          </div>
        </aside>

        <aside className={`order-2 p-5 sm:p-6 xl:order-none ${shellPanelClassName}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
                Inbox
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
                Chats
              </h1>
            </div>
            <div className="rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {filteredConversations.length} open
            </div>
          </div>

          <label className="mt-8 block">
            <div className="flex items-center gap-3 rounded-full bg-white px-5 py-4 shadow-sm ring-1 ring-orange-100">
              <svg className="h-5 w-5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" />
              </svg>
              <input
                className="w-full bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search conversations..."
                value={searchTerm}
              />
            </div>
          </label>

          <div className="mt-8 space-y-4">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                active={conversation.id === activeConversationId}
                conversation={conversation}
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
              />
            ))}
          </div>

          <div className="mt-6 rounded-[28px] border border-orange-200/70 bg-white/70 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
              Quick chat setup
            </p>
            <div className="mt-4 grid gap-3">
              <Field label="Chat ID">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setChatForm((current) => ({
                      ...current,
                      chatId: event.target.value,
                    }))
                  }
                  placeholder="123"
                  value={chatForm.chatId}
                />
              </Field>
              <Field label="Participant IDs">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setChatForm((current) => ({
                      ...current,
                      participantIds: event.target.value,
                    }))
                  }
                  placeholder="10,11"
                  value={chatForm.participantIds}
                />
              </Field>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "messages" || !session.authenticated}
                  onClick={handleLoadMessages}
                  type="button"
                >
                  {busyAction === "messages" ? "Loading..." : "Load messages"}
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "bootstrap"}
                  onClick={() => {
                    void handleBootstrapChat();
                  }}
                  type="button"
                >
                  {busyAction === "bootstrap" ? "Creating..." : "Seed chat"}
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section className={`order-1 flex min-h-[820px] flex-col overflow-hidden xl:order-none ${shellPanelClassName}`}>
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${activeConversation.avatarTone} text-lg font-semibold text-white shadow-sm`}
              >
                {getInitials(activeConversation.name)}
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                  {activeConversation.name}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-stone-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />
                  <span className="text-sm font-medium">Active Now</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-stone-600">
              {(["video", "phone", "info"] as const).map((type) => (
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-100 bg-white transition hover:border-orange-200 hover:text-orange-700"
                  key={type}
                  onClick={() => {
                    if (type === "info") {
                      setSidePanelView("contact");
                    }
                  }}
                  type="button"
                >
                  <HeaderActionIcon type={type} />
                </button>
              ))}
            </div>
          </header>

          <div className="flex flex-1 flex-col bg-[linear-gradient(180deg,#f5f3f1,#fcfcfc)] px-4 py-4 sm:px-7 sm:py-6">
            <div className="flex justify-center">
              <span className="rounded-full bg-stone-200/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Today
              </span>
            </div>

            <div className="mt-8 flex-1 space-y-8 overflow-y-auto pr-1">
              {threadMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>

            <form className="mt-6" onSubmit={handleSendMessage}>
              <div className="rounded-full border border-orange-100 bg-[#f4f4f2] px-3 py-3 shadow-inner sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 text-stone-500">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white" type="button">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 5h2v14h-2zM5 11h14v2H5z" />
                      </svg>
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white" type="button">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10Zm-3-7 1.5 1.5L12 15l1.5 1.5L15 15l-1.5-1.5L15 12l-1.5-1.5L12 12l-1.5-1.5L9 12l1.5 1.5L9 15Zm-1.5-5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                      </svg>
                    </button>
                  </div>

                  <textarea
                    className="min-h-8 flex-1 resize-none bg-transparent px-2 py-2 text-base text-stone-900 outline-none placeholder:text-stone-400"
                    onChange={(event) =>
                      setChatForm((current) => ({
                        ...current,
                        outboundMessage: event.target.value,
                      }))
                    }
                    placeholder="Type a message..."
                    rows={1}
                    value={chatForm.outboundMessage}
                  />

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-white hover:text-orange-700" type="button">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 16a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V23h2v-3.1A7 7 0 0 0 19 13Z" />
                      </svg>
                    </button>
                    <button
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-700 to-orange-500 text-white shadow-[0_18px_34px_rgba(249,115,22,0.32)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={busyAction === "send" || !session.authenticated}
                      type="submit"
                    >
                      <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 20 22 12 3 4v6l13 2-13 2v6Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>

        <aside className={`order-3 flex flex-col p-5 sm:p-6 ${shellPanelClassName}`}>
          <div className="flex items-center justify-between gap-3 rounded-full border border-orange-100 bg-white/75 p-2">
            <PanelTabButton
              active={sidePanelView === "contact"}
              onClick={() => setSidePanelView("contact")}
            >
              Contato
            </PanelTabButton>
            <PanelTabButton
              active={sidePanelView === "profile"}
              onClick={() => setSidePanelView("profile")}
            >
              Meu Perfil
            </PanelTabButton>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto pr-1">
            {sidePanelView === "contact" ? (
              <ContactPanel
                activeConversation={activeConversation}
                onBack={() => setSidePanelView("contact")}
              />
            ) : (
              <MyProfilePanel
                bootstrapResult={bootstrapResult}
                busyAction={busyAction}
                chatSeedForm={chatSeedForm}
                clientForm={clientForm}
                handleBootstrapChat={handleBootstrapChat}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                handleRegisterClient={handleRegisterClient}
                loginForm={loginForm}
                loginResult={loginResult}
                messagesResult={messagesResult}
                notice={notice}
                registerResult={registerResult}
                sendResult={sendResult}
                session={session}
                setChatSeedForm={setChatSeedForm}
                setClientForm={setClientForm}
                setLoginForm={setLoginForm}
              />
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
