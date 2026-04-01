"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SessionSnapshot } from "@/lib/helpdesk";

type ApiResult = {
  status: number;
  payload: unknown;
};

type RequestOptions = RequestInit & {
  body?: BodyInit | null;
};

type AuthMode = "login" | "register";
type FeedbackTone = "error" | "info" | "success";
type ResultKey =
  | "authChallenge"
  | "authVerify"
  | "authLogin"
  | "authRegisterBasic"
  | "authRegister"
  | "authRegisterComplete"
  | "authMe"
  | "authRefresh"
  | "clientRegister"
  | "chatBootstrap"
  | "attendantCreate"
  | "attendantUpdate"
  | "attendantDelete"
  | "clientCreate"
  | "clientUpdate"
  | "clientDelete"
  | "clientResolve"
  | "contactCreate"
  | "contactUpdate"
  | "contactDelete"
  | "chatsList"
  | "chatCreate"
  | "chatWhatsappSession"
  | "chatView"
  | "chatTransfer"
  | "messagesList"
  | "messageSend"
  | "messageSendOutbound"
  | "webhookVerify"
  | "webhookReceive";

type LoginFormState = {
  username: string;
  password: string;
};

type RegisterFormState = {
  name: string;
  email: string;
  username: string;
  contact: string;
  password: string;
  confirmPassword: string;
  type: string;
  gender: string;
  birthDate: string;
  zipCode: string;
  address: string;
  district: string;
  number: string;
  cityName: string;
  stateCode: string;
  countryCode: string;
  typeContact: string;
};

type ChallengeFormState = {
  channel: string;
  identifier: string;
};

type VerifyFormState = {
  challengeId: string;
  code: string;
};

type RegisterBasicFormState = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  birthDate: string;
  contact: string;
};

type CompleteRegistrationFormState = {
  name: string;
  type: string;
  gender: string;
  birthDate: string;
  cpfCnpj: string;
  zipCode: string;
  address: string;
  district: string;
  number: string;
  cityName: string;
  stateCode: string;
  countryCode: string;
  typeContact: string;
  contact: string;
};

type AttendantFormState = {
  externalId: string;
  name: string;
  nickname: string;
  type: string;
};

type ClientRegisterFormState = {
  externalId: string;
  name: string;
  nickname: string;
  contactType: string;
  contactValue: string;
  externalContactId: string;
};

type ClientFormState = {
  id: string;
  externalId: string;
  name: string;
  nickname: string;
};

type ContactFormState = {
  contactId: string;
  userId: string;
  externalContactId: string;
  type: string;
  value: string;
};

type ResolveContactFormState = {
  phoneNumber: string;
  contactName: string;
};

type ChatFormState = {
  activeChannel: string;
  perPage: string;
  chatId: string;
  participantIds: string;
  toAttendentId: string;
  outboundMessage: string;
  messageChannel: string;
  messageType: string;
};

type WebhookVerifyFormState = {
  mode: string;
  verifyToken: string;
  challenge: string;
};

type WebhookReceiveFormState = {
  businessAccountId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  contactName: string;
  sender: string;
  messageId: string;
  messageBody: string;
};

type WhatsAppSessionFormState = {
  phoneNumber: string;
  contactName: string;
};

type BootstrapChatFormState = {
  from: string;
  senderName: string;
  message: string;
};

type OutboundMessageFormState = {
  chatId: string;
  channel: string;
  type: string;
  message: string;
  mediaUrl: string;
  caption: string;
  fileName: string;
};

type DemoChatFormState = {
  phoneNumber: string;
  contactName: string;
  message: string;
};

type ThreadMessage = {
  id: string;
  content: string;
  side: "incoming" | "outgoing";
  time: string;
};

type ChatSummary = {
  id: string;
  title: string;
  preview: string;
  channel: string;
  updatedAt: string;
  participantId: string;
};

const shellPanelClassName =
  "rounded-[34px] border border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,245,236,0.94))] shadow-[0_30px_90px_rgba(194,65,12,0.12)] backdrop-blur";
const cardClassName =
  "rounded-[28px] border border-orange-200/70 bg-white/95 p-5 shadow-[0_16px_40px_rgba(249,115,22,0.08)]";
const inputClassName =
  "mt-2 w-full rounded-2xl border border-orange-200/80 bg-white/95 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-200/70";
const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-700 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(249,115,22,0.24)] transition hover:from-orange-800 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-orange-200 bg-white/90 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60";

const resultOrder: { key: ResultKey; label: string }[] = [
  { key: "authChallenge", label: "Auth / Challenge" },
  { key: "authVerify", label: "Auth / Verify" },
  { key: "authLogin", label: "Auth / Login" },
  { key: "authRegisterBasic", label: "Auth / Register Basic" },
  { key: "authRegister", label: "Auth / Register" },
  { key: "authRegisterComplete", label: "Auth / Register Complete" },
  { key: "authMe", label: "Auth / Me" },
  { key: "authRefresh", label: "Auth / Refresh" },
  { key: "clientRegister", label: "Clients / Register" },
  { key: "chatBootstrap", label: "Chats / Bootstrap" },
  { key: "attendantCreate", label: "Attendants / Create" },
  { key: "attendantUpdate", label: "Attendants / Update" },
  { key: "attendantDelete", label: "Attendants / Delete" },
  { key: "clientCreate", label: "Clients / Create" },
  { key: "clientUpdate", label: "Clients / Update" },
  { key: "clientDelete", label: "Clients / Delete" },
  { key: "clientResolve", label: "Clients / Resolve WhatsApp Contact" },
  { key: "contactCreate", label: "Clients / Create Contact" },
  { key: "contactUpdate", label: "Clients / Update Contact" },
  { key: "contactDelete", label: "Clients / Delete Contact" },
  { key: "chatsList", label: "Chats / List" },
  { key: "chatCreate", label: "Chats / Create" },
  { key: "chatWhatsappSession", label: "Chats / Open WhatsApp Session" },
  { key: "chatView", label: "Chats / View" },
  { key: "chatTransfer", label: "Chats / Transfer" },
  { key: "messagesList", label: "Messages / List" },
  { key: "messageSend", label: "Messages / Receive Internal" },
  { key: "messageSendOutbound", label: "Messages / Send Outbound" },
  { key: "webhookVerify", label: "Webhooks / Verify" },
  { key: "webhookReceive", label: "Webhooks / Receive" },
];

const fallbackMessages: ThreadMessage[] = [
  {
    id: "fallback-1",
    content: "Carregue um chat real para listar mensagens da Helpdesk API.",
    side: "incoming",
    time: "Agora",
  },
  {
    id: "fallback-2",
    content:
      "Use os paineis da direita para criar cliente, contato, chat ou simular um webhook do WhatsApp.",
    side: "outgoing",
    time: "Agora",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
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

function formatTimestamp(value: string) {
  const isoLikeMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/,
  );

  if (isoLikeMatch) {
    const [, , month, day, hour, minute] = isoLikeMatch;
    return `${day}/${month} ${hour}:${minute}`;
  }

  if (/^\d{10,13}$/.test(value)) {
    const numeric = Number(value);
    const date = new Date(value.length === 13 ? numeric : numeric * 1000);

    if (!Number.isNaN(date.getTime())) {
      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const hour = String(date.getUTCHours()).padStart(2, "0");
      const minute = String(date.getUTCMinutes()).padStart(2, "0");

      return `${day}/${month} ${hour}:${minute}`;
    }
  }

  return value;
}

function formatMessageTime(record: Record<string, unknown>) {
  const raw =
    findValueByKeys(record, ["created_at", "updated_at", "timestamp", "time"]) ??
    "Agora";

  if (typeof raw !== "string") {
    return "Agora";
  }

  return formatTimestamp(raw);
}

function isOutgoingMessage(record: Record<string, unknown>) {
  const candidates = [
    record.is_mine,
    record.mine,
    record.is_from_me,
    record.outgoing,
  ];

  for (const candidate of candidates) {
    if (candidate === true) {
      return true;
    }

    if (candidate === false) {
      return false;
    }
  }

  const source = findValueByKeys(record, [
    "direction",
    "sender_type",
    "origin",
    "source",
  ]);

  if (typeof source !== "string") {
    return false;
  }

  const normalized = source.toLowerCase();
  return (
    normalized.includes("out") ||
    normalized.includes("sent") ||
    normalized.includes("attend") ||
    normalized.includes("agent") ||
    normalized.includes("internal")
  );
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
        time: formatMessageTime(record),
        side: isOutgoingMessage(record) ? "outgoing" : "incoming",
      } satisfies ThreadMessage;
    })
    .filter((message): message is ThreadMessage => message !== null);
}

function normalizeChats(payload: unknown): ChatSummary[] {
  const source = isRecord(payload) && "data" in payload ? payload.data : payload;
  const records = findArrayOfRecords(source);

  if (!records) {
    return [];
  }

  return records.map((record, index) => {
    const id =
      String(findValueByKeys(record, ["chat_id", "id"]) ?? `chat-${index}`) ||
      `chat-${index}`;
    const title =
      String(
        findValueByKeys(record, [
          "name",
          "title",
          "client_name",
          "contact_name",
          "subject",
        ]) ?? `Chat ${id}`,
      ) || `Chat ${id}`;
    const preview =
      String(
        findValueByKeys(record, [
          "last_message",
          "message",
          "body",
          "text",
          "content",
        ]) ?? "Sem previa de mensagem.",
      ) || "Sem previa de mensagem.";
    const channel =
      String(
        findValueByKeys(record, ["active_channel", "channel", "type"]) ??
          "whatsapp",
      ) || "whatsapp";
    const updatedAt =
      String(
        findValueByKeys(record, ["updated_at", "created_at", "timestamp"]) ??
          "Agora",
      ) || "Agora";
    const participantId =
      String(findValueByKeys(record, ["participant_id", "participantId"]) ?? "") ||
      "";

    return {
      id,
      title,
      preview,
      channel,
      updatedAt: formatTimestamp(updatedAt),
      participantId,
    } satisfies ChatSummary;
  });
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
  }

  if (!values.password.trim()) {
    errors.password = "Informe sua senha.";
  }

  return errors;
}

function validateRegisterForm(values: RegisterFormState) {
  const errors: Record<string, string | undefined> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!values.name.trim()) {
    errors.name = "Informe o nome.";
  }

  if (!values.email.trim()) {
    errors.email = "Informe o e-mail.";
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = "Digite um e-mail valido.";
  }

  if (!values.username.trim()) {
    errors.username = "Informe o username.";
  }

  if (!values.contact.trim()) {
    errors.contact = "Informe o contato.";
  }

  if (!values.password) {
    errors.password = "Informe a senha.";
  } else if (values.password.length < 8) {
    errors.password = "Use pelo menos 8 caracteres.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirme a senha.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "As senhas nao conferem.";
  }

  if (!values.typeContact.trim()) {
    errors.typeContact = "Informe o tipo de contato.";
  }

  return errors;
}

function getMessageFromPayload(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const candidates = ["message", "error", "detail", "details"];

  for (const key of candidates) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function readAuthTokens(payload: unknown) {
  if (!isRecord(payload)) {
    return {
      accessToken: null,
      refreshToken: null,
    };
  }

  const auth = isRecord(payload.auth) ? payload.auth : payload;
  const nested = isRecord(auth.data) ? auth.data : null;
  const accessToken =
    typeof auth.access_token === "string"
      ? auth.access_token
      : typeof nested?.access_token === "string"
        ? nested.access_token
        : null;
  const refreshToken =
    typeof auth.refresh_token === "string"
      ? auth.refresh_token
      : typeof nested?.refresh_token === "string"
        ? nested.refresh_token
        : null;

  return {
    accessToken,
    refreshToken,
  };
}

function persistBrowserTokens(payload: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  const tokens = readAuthTokens(payload);

  if (tokens.accessToken) {
    window.localStorage.setItem("helpdesk_access_token", tokens.accessToken);
  }

  if (tokens.refreshToken) {
    window.localStorage.setItem("helpdesk_refresh_token", tokens.refreshToken);
  }
}

function clearBrowserTokens() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("helpdesk_access_token");
  window.localStorage.removeItem("helpdesk_refresh_token");
}

function buildWebhookPayload(form: WebhookReceiveFormState) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: form.businessAccountId,
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: form.displayPhoneNumber,
                phone_number_id: form.phoneNumberId,
              },
              contacts: [
                {
                  profile: {
                    name: form.contactName,
                  },
                  wa_id: form.sender,
                },
              ],
              messages: [
                {
                  from: form.sender,
                  id: form.messageId,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: {
                    body: form.messageBody,
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function subscribeToHydration() {
  return () => {};
}

function Field({
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
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
          {label}
        </span>
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </div>
      {children}
    </label>
  );
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className={cardClassName} open={defaultOpen}>
      <summary className="cursor-pointer list-none">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
          {title}
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-500">{description}</p>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function JsonPanel({
  title,
  result,
}: {
  title: string;
  result: ApiResult;
}) {
  return (
    <div className="rounded-[24px] border border-orange-400/20 bg-[linear-gradient(180deg,#2b1406,#130d0a)] p-4 text-xs text-stone-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <strong className="text-[0.7rem] uppercase tracking-[0.22em] text-orange-200">
          {title}
        </strong>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-stone-300">
          HTTP {result.status}
        </span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(result.payload, null, 2)}
      </pre>
    </div>
  );
}

function ChatItem({
  chat,
  active,
  onClick,
}: {
  chat: ChatSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full rounded-[30px] border px-4 py-4 text-left transition ${
        active
          ? "border-orange-200 bg-white shadow-[0_22px_38px_rgba(249,115,22,0.12)]"
          : "border-transparent bg-[#fff4e9] hover:border-orange-100 hover:bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f7c398] to-[#db6d1c] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(219,109,28,0.2)]">
          {getInitials(chat.title || chat.id)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[0.98rem] font-semibold text-stone-950">
                {chat.title}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-orange-600">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span>{chat.channel}</span>
              </div>
            </div>
            <span className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
              {chat.updatedAt}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="line-clamp-2 text-sm leading-6 text-stone-500">
              {chat.preview}
            </p>
            {active ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 text-[0.64rem] font-semibold text-white">
                ao vivo
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  const outgoing = message.side === "outgoing";

  return (
    <div className={`flex items-end gap-3 ${outgoing ? "justify-end" : "justify-start"}`}>
      {!outgoing ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1d5bb] text-[0.72rem] font-semibold text-[#8a4a15]">
          {getInitials(message.id)}
        </div>
      ) : null}
      <div className="max-w-[88%]">
        <div
          className={`rounded-[24px] px-5 py-4 shadow-[0_18px_34px_rgba(0,0,0,0.06)] ${
            outgoing
              ? "rounded-br-[10px] bg-gradient-to-r from-[#b84e0a] via-[#d86a17] to-[#eb7b21] text-white"
              : "rounded-bl-[10px] border border-white/80 bg-[#efefef] text-stone-800"
          }`}
        >
          <p className="text-sm leading-7">{message.content}</p>
        </div>
        <p
          className={`mt-2 px-1 text-xs text-stone-500 ${
            outgoing ? "text-right" : "text-left"
          }`}
        >
          {message.time}
        </p>
      </div>
      {outgoing ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f7c398] to-[#db6d1c] text-[0.72rem] font-semibold text-white">
          Eu
        </div>
      ) : null}
    </div>
  );
}

function AuthScreen({
  mode,
  setMode,
  loginForm,
  setLoginForm,
  challengeForm,
  setChallengeForm,
  verifyForm,
  setVerifyForm,
  registerForm,
  setRegisterForm,
  registerBasicForm,
  setRegisterBasicForm,
  loginErrors,
  registerErrors,
  feedback,
  busyAction,
  onLogin,
  onChallenge,
  onVerify,
  onRegisterBasic,
  onRegister,
}: {
  mode: AuthMode;
  setMode: (value: AuthMode) => void;
  loginForm: LoginFormState;
  setLoginForm: (value: LoginFormState) => void;
  challengeForm: ChallengeFormState;
  setChallengeForm: (value: ChallengeFormState) => void;
  verifyForm: VerifyFormState;
  setVerifyForm: (value: VerifyFormState) => void;
  registerForm: RegisterFormState;
  setRegisterForm: (value: RegisterFormState) => void;
  registerBasicForm: RegisterBasicFormState;
  setRegisterBasicForm: (value: RegisterBasicFormState) => void;
  loginErrors: Record<string, string | undefined>;
  registerErrors: Record<string, string | undefined>;
  feedback: { tone: FeedbackTone; message: string } | null;
  busyAction: string | null;
  onLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onChallenge: () => Promise<void>;
  onVerify: () => Promise<void>;
  onRegisterBasic: () => Promise<void>;
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
    <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1460px] flex-1 items-center px-3 py-3 sm:px-5 sm:py-5">
      <section className="grid w-full overflow-hidden rounded-[34px] border border-orange-200/60 bg-white shadow-[0_40px_120px_rgba(194,65,12,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#c75b14_0%,#f97316_55%,#ff7a1a_100%)] px-8 py-10 text-white sm:px-12 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.16),transparent_38%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">Helpdesk API</p>
              <p className="mt-3 text-sm text-orange-50/84">
                Front office conectado ao BFF local para autenticacao, onboarding,
                inbox e integracoes da Helpdesk API.
              </p>
            </div>

            <div className="max-w-md py-10 lg:py-0">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-100/85">
                Fluxos operacionais
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Autentique, cadastre clientes e opere conversas reais da Helpdesk
                API.
              </h1>
              <p className="mt-5 text-base leading-8 text-orange-50/92">
                A tela autenticada organiza a API em jornadas de front: entrada
                do cliente, conversa, transferencia e webhook.
              </p>
            </div>

            <div className="hidden text-sm text-orange-100/70 lg:block">
              Next 16 App Router • Cookie session • Front orientado por fluxo
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-14">
          <div className="w-full max-w-[720px]">
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
                {isLogin ? "Entrar no workspace." : "Criar conta real na API."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                {isLogin
                  ? "Use seu usuario e senha para abrir a sessao protegida por cookie."
                  : "Campos alinhados com a colecao Postman do backend Helpdesk."}
              </p>
            </div>

            {feedback ? (
              <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${feedbackClassName}`}>
                {feedback.message}
              </div>
            ) : null}

            {isLogin ? (
              <form className="mt-7 space-y-4" onSubmit={onLogin}>
                <Field error={loginErrors.username} label="Username or email">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        username: event.target.value,
                      })
                    }
                    placeholder="customer@example.com"
                    value={loginForm.username}
                  />
                </Field>

                <Field error={loginErrors.password} label="Password">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        password: event.target.value,
                      })
                    }
                    placeholder="password123"
                    type="password"
                    value={loginForm.password}
                  />
                </Field>

                <button
                  className={`${primaryButtonClassName} mt-3 w-full`}
                  disabled={busyAction === "login"}
                  type="submit"
                >
                  {busyAction === "login" ? "Entrando..." : "Entrar"}
                </button>

                <div className="rounded-[26px] border border-orange-100 bg-orange-50/70 p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
                    OTP via Challenge
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Fluxo vindo da collection Postman: `POST /auth/challenge` e
                    `POST /auth/verify`.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Channel">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setChallengeForm({
                              ...challengeForm,
                              channel: event.target.value,
                            })
                          }
                          value={challengeForm.channel}
                        />
                      </Field>
                      <Field label="Identifier">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setChallengeForm({
                              ...challengeForm,
                              identifier: event.target.value,
                            })
                          }
                          value={challengeForm.identifier}
                        />
                      </Field>
                    </div>
                    <button
                      className={secondaryButtonClassName}
                      disabled={busyAction === "challenge"}
                      onClick={() => {
                        void onChallenge();
                      }}
                      type="button"
                    >
                      {busyAction === "challenge"
                        ? "Solicitando..."
                        : "Solicitar challenge"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 border-t border-orange-100 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Challenge ID">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setVerifyForm({
                              ...verifyForm,
                              challengeId: event.target.value,
                            })
                          }
                          value={verifyForm.challengeId}
                        />
                      </Field>
                      <Field label="Code">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setVerifyForm({
                              ...verifyForm,
                              code: event.target.value,
                            })
                          }
                          value={verifyForm.code}
                        />
                      </Field>
                    </div>
                    <button
                      className={secondaryButtonClassName}
                      disabled={busyAction === "verify"}
                      onClick={() => {
                        void onVerify();
                      }}
                      type="button"
                    >
                      {busyAction === "verify" ? "Validando..." : "Validar challenge"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form className="mt-7 space-y-4" onSubmit={onRegister}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field error={registerErrors.name} label="Name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          name: event.target.value,
                        })
                      }
                      placeholder="Novo Cliente"
                      value={registerForm.name}
                    />
                  </Field>
                  <Field error={registerErrors.email} label="Email">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          email: event.target.value,
                        })
                      }
                      placeholder="novo@example.com"
                      value={registerForm.email}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field error={registerErrors.username} label="Username">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          username: event.target.value,
                        })
                      }
                      placeholder="novo.cliente"
                      value={registerForm.username}
                    />
                  </Field>
                  <Field error={registerErrors.contact} label="Contact">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          contact: event.target.value,
                        })
                      }
                      placeholder="+5569992814769"
                      value={registerForm.contact}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field error={registerErrors.password} label="Password">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          password: event.target.value,
                        })
                      }
                      type="password"
                      value={registerForm.password}
                    />
                  </Field>
                  <Field
                    error={registerErrors.confirmPassword}
                    label="Password confirmation"
                  >
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          confirmPassword: event.target.value,
                        })
                      }
                      type="password"
                      value={registerForm.confirmPassword}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Type">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          type: event.target.value,
                        })
                      }
                      value={registerForm.type}
                    />
                  </Field>
                  <Field label="Gender">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          gender: event.target.value,
                        })
                      }
                      value={registerForm.gender}
                    />
                  </Field>
                  <Field error={registerErrors.typeContact} label="Type contact">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          typeContact: event.target.value,
                        })
                      }
                      value={registerForm.typeContact}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Birth date">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          birthDate: event.target.value,
                        })
                      }
                      type="date"
                      value={registerForm.birthDate}
                    />
                  </Field>
                  <Field label="Zip code">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          zipCode: event.target.value,
                        })
                      }
                      value={registerForm.zipCode}
                    />
                  </Field>
                </div>

                <Field label="Address">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        address: event.target.value,
                      })
                    }
                    value={registerForm.address}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="District">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          district: event.target.value,
                        })
                      }
                      value={registerForm.district}
                    />
                  </Field>
                  <Field label="Number">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          number: event.target.value,
                        })
                      }
                      value={registerForm.number}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          cityName: event.target.value,
                        })
                      }
                      value={registerForm.cityName}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="State code">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          stateCode: event.target.value,
                        })
                      }
                      value={registerForm.stateCode}
                    />
                  </Field>
                  <Field label="Country code">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          countryCode: event.target.value,
                        })
                      }
                      value={registerForm.countryCode}
                    />
                  </Field>
                </div>

                <button
                  className={`${primaryButtonClassName} mt-3 w-full`}
                  disabled={busyAction === "register"}
                  type="submit"
                >
                  {busyAction === "register" ? "Cadastrando..." : "Criar conta"}
                </button>

                <div className="rounded-[26px] border border-orange-100 bg-orange-50/70 p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
                    Register Basic
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Fluxo simplificado da collection para `POST /auth/register/basic`.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Email">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setRegisterBasicForm({
                              ...registerBasicForm,
                              email: event.target.value,
                            })
                          }
                          value={registerBasicForm.email}
                        />
                      </Field>
                      <Field label="Name">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setRegisterBasicForm({
                              ...registerBasicForm,
                              name: event.target.value,
                            })
                          }
                          value={registerBasicForm.name}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Password">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setRegisterBasicForm({
                              ...registerBasicForm,
                              password: event.target.value,
                            })
                          }
                          type="password"
                          value={registerBasicForm.password}
                        />
                      </Field>
                      <Field label="Password confirmation">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setRegisterBasicForm({
                              ...registerBasicForm,
                              confirmPassword: event.target.value,
                            })
                          }
                          type="password"
                          value={registerBasicForm.confirmPassword}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Birth date">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setRegisterBasicForm({
                              ...registerBasicForm,
                              birthDate: event.target.value,
                            })
                          }
                          type="date"
                          value={registerBasicForm.birthDate}
                        />
                      </Field>
                      <Field label="Contact">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            setRegisterBasicForm({
                              ...registerBasicForm,
                              contact: event.target.value,
                            })
                          }
                          value={registerBasicForm.contact}
                        />
                      </Field>
                    </div>
                    <button
                      className={secondaryButtonClassName}
                      disabled={busyAction === "register-basic"}
                      onClick={() => {
                        void onRegisterBasic();
                      }}
                      type="button"
                    >
                      {busyAction === "register-basic"
                        ? "Criando..."
                        : "Criar cadastro basico"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function RestoringSessionScreen({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[900px] flex-1 items-center justify-center px-3 py-3 sm:px-5 sm:py-5">
      <section className={`${shellPanelClassName} w-full p-10 text-center`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-700">
          <svg
            className="h-7 w-7 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.2-8.6" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-950">
          Restaurando sessao
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-500">{message}</p>
      </section>
    </main>
  );
}

export default function HelpdeskPlayground({
  initialSession,
}: {
  initialSession: SessionSnapshot;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionSnapshot>(initialSession);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<{
    tone: FeedbackTone;
    message: string;
  } | null>(null);
  const [results, setResults] = useState<Partial<Record<ResultKey, ApiResult>>>(
    {},
  );

  const [loginForm, setLoginForm] = useState<LoginFormState>({
    username: "customer@example.com",
    password: "password123",
  });
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    username: "",
    contact: "",
    password: "",
    confirmPassword: "",
    type: "individual",
    gender: "male",
    birthDate: "1990-01-01",
    zipCode: "69000000",
    address: "Rua Exemplo",
    district: "Centro",
    number: "100",
    cityName: "Manaus",
    stateCode: "AM",
    countryCode: "BR",
    typeContact: "phone",
  });
  const [challengeForm, setChallengeForm] = useState<ChallengeFormState>({
    channel: "email",
    identifier: "customer@example.com",
  });
  const [verifyForm, setVerifyForm] = useState<VerifyFormState>({
    challengeId: "",
    code: "ABC123",
  });
  const [registerBasicForm, setRegisterBasicForm] =
    useState<RegisterBasicFormState>({
      email: "novo@example.com",
      password: "password123",
      confirmPassword: "password123",
      name: "Novo Cliente",
      birthDate: "1990-01-01",
      contact: "+5569992814769",
    });
  const [completeRegistrationForm, setCompleteRegistrationForm] =
    useState<CompleteRegistrationFormState>({
      name: "Novo Cliente Atualizado",
      type: "individual",
      gender: "male",
      birthDate: "1990-01-01",
      cpfCnpj: "11144477735",
      zipCode: "69000000",
      address: "Rua Exemplo",
      district: "Centro",
      number: "100",
      cityName: "Manaus",
      stateCode: "AM",
      countryCode: "BR",
      typeContact: "phone",
      contact: "+5569992814769",
    });
  const [clientRegisterForm, setClientRegisterForm] =
    useState<ClientRegisterFormState>({
      externalId: "client-001",
      name: "Cliente Meta",
      nickname: "cliente",
      contactType: "whatsapp",
      contactValue: "5569992814769",
      externalContactId: "whatsapp-client-001",
    });
  const [attendantForm, setAttendantForm] = useState<AttendantFormState>({
    externalId: "att-001",
    name: "Atendente Exemplo",
    nickname: "atendimento",
    type: "attendent",
  });
  const [clientForm, setClientForm] = useState<ClientFormState>({
    id: "",
    externalId: "client-001",
    name: "Cliente Exemplo",
    nickname: "compras",
  });
  const [contactForm, setContactForm] = useState<ContactFormState>({
    contactId: "",
    userId: "",
    externalContactId: "whatsapp-client-001",
    type: "whatsapp",
    value: "5511999999999",
  });
  const [resolveContactForm, setResolveContactForm] =
    useState<ResolveContactFormState>({
      phoneNumber: "5569992814769",
      contactName: "Cliente Meta",
    });
  const [chatForm, setChatForm] = useState<ChatFormState>({
    activeChannel: "whatsapp",
    perPage: "10",
    chatId: "",
    participantIds: "",
    toAttendentId: "att-002",
    outboundMessage: "Mensagem interna de teste",
    messageChannel: "web",
    messageType: "text",
  });
  const [webhookVerifyForm, setWebhookVerifyForm] =
    useState<WebhookVerifyFormState>({
      mode: "subscribe",
      verifyToken: "gvm",
      challenge: "challenge-123",
    });
  const [webhookReceiveForm, setWebhookReceiveForm] =
    useState<WebhookReceiveFormState>({
      businessAccountId: "2160812194729576",
      phoneNumberId: "1049921724868088",
      displayPhoneNumber: "",
      contactName: "Cliente Meta",
      sender: "5569992814769",
      messageId: "wamid.teste.001",
      messageBody: "Ola via Meta",
    });
  const [whatsAppSessionForm, setWhatsAppSessionForm] =
    useState<WhatsAppSessionFormState>({
      phoneNumber: "5569992814769",
      contactName: "Cliente Meta",
    });
  const [bootstrapChatForm, setBootstrapChatForm] =
    useState<BootstrapChatFormState>({
      from: "5569992814769",
      senderName: "Cliente Meta",
      message: "Ola, preciso de ajuda com meu pedido.",
    });
  const [outboundMessageForm, setOutboundMessageForm] =
    useState<OutboundMessageFormState>({
      chatId: "",
      channel: "web",
      type: "text",
      message:
        "Ola! 🚜\nRecebi sua solicitacao e ja estou verificando o pedido 12345.\nSe preferir, posso continuar por aqui com todos os detalhes. 🙂",
      mediaUrl: "https://cdn.example.com/file.jpg",
      caption: "Arquivo enviado pelo atendente",
      fileName: "arquivo.pdf",
    });
  const [demoChatForm, setDemoChatForm] = useState<DemoChatFormState>({
    phoneNumber: "5569992814769",
    contactName: "Cliente Meta",
    message:
      "Ola! Esta e uma demonstracao do chat funcionando direto pelo front.",
  });
  const [loginErrors, setLoginErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [registerErrors, setRegisterErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [liveChats, setLiveChats] = useState<ChatSummary[]>([]);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>(
    fallbackMessages,
  );
  const [chatSearch, setChatSearch] = useState("");
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const inboxBootstrappedRef = useRef(false);

  const filteredChats = liveChats.filter((chat) => {
    const haystack = `${chat.title} ${chat.preview} ${chat.channel}`.toLowerCase();
    return haystack.includes(chatSearch.toLowerCase());
  });
  const activeChat = liveChats.find((chat) => chat.id === chatForm.chatId) ?? null;
  const renderedMessages =
    threadMessages.length > 0 ? threadMessages : fallbackMessages;
  const recentResponses = Object.entries(results)
    .flatMap(([key, result]) =>
      result
        ? [
            {
              key: key as ResultKey,
              label: resultOrder.find((entry) => entry.key === key)?.label ?? key,
              result,
            },
          ]
        : [],
    )
    .slice(-4)
    .reverse();

  const userName =
    String(findValueByKeys(session.user, ["name", "username", "email"]) ?? "Usuario") ||
    "Usuario";
  const userEmail =
    String(findValueByKeys(session.user, ["email", "username"]) ?? "") || "";

  function navigateTo(path: string) {
    if (typeof window !== "undefined") {
      window.location.assign(path);
      return;
    }

    router.replace(path);
  }

  function storeResult(key: ResultKey, result: { status: number; payload: unknown }) {
    setResults((current) => ({
      ...current,
      [key]: {
        status: result.status,
        payload: result.payload,
      },
    }));
  }

  function syncChatIdentifiers(payload: unknown) {
    const chatId = findValueByKeys(payload, ["chat_id", "chatId", "id"]);
    const participantId = findValueByKeys(payload, [
      "participant_id",
      "participantId",
    ]);

    if (chatId !== null || participantId !== null) {
      setChatForm((current) => ({
        ...current,
        chatId: chatId !== null ? String(chatId) : current.chatId,
        participantIds:
          participantId !== null ? String(participantId) : current.participantIds,
      }));
    }

    if (chatId !== null) {
      setOutboundMessageForm((current) => ({
        ...current,
        chatId: String(chatId),
      }));
    }
  }

  function syncClientIdentifiers(payload: unknown) {
    const clientPayload =
      isRecord(payload) && isRecord(payload.client) ? payload.client : payload;
    const contactPayload =
      isRecord(payload) && isRecord(payload.contact) ? payload.contact : payload;
    const clientId = findValueByKeys(clientPayload, ["client_id", "user_id", "id"]);
    const contactId = findValueByKeys(contactPayload, ["contact_id", "id"]);

    if (clientId !== null) {
      setClientForm((current) => ({
        ...current,
        id: String(clientId),
      }));

      setContactForm((current) => ({
        ...current,
        userId: String(clientId),
      }));
    }

    if (contactId !== null) {
      setContactForm((current) => ({
        ...current,
        contactId: String(contactId),
      }));
    }
  }

  function syncChallengeIdentifier(payload: unknown) {
    const challengeId = findValueByKeys(payload, ["challenge_id", "challengeId"]);

    if (challengeId !== null) {
      setVerifyForm((current) => ({
        ...current,
        challengeId: String(challengeId),
      }));
    }
  }

  async function loadSession() {
    const result = await requestJson("/api/session");

    if (result.ok && isRecord(result.payload)) {
      setSession(result.payload as SessionSnapshot);
      setNotice(
        typeof result.payload.error === "string" ? result.payload.error : null,
      );
      return result;
    }

    setSession(initialSession);
    setNotice("Nao foi possivel consultar a sessao atual.");
    return result;
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
      body: JSON.stringify(loginForm),
    });

    storeResult("authLogin", result);

    if (result.ok) {
      persistBrowserTokens(result.payload);
      setLoginErrors({});
      setAuthFeedback({
        tone: "success",
        message: "Sessao iniciada com sucesso.",
      });
      await loadSession();
      navigateTo("/chat");
    } else {
      setAuthFeedback({
        tone: "error",
        message: getMessageFromPayload(result.payload, "Falha ao autenticar."),
      });
    }

    setBusyAction(null);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegisterForm(registerForm);
    setRegisterErrors(nextErrors);
    setAuthFeedback(null);

    if (hasErrors(nextErrors)) {
      return;
    }

    setBusyAction("register");
    setNotice(null);

    const result = await requestJson("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: registerForm.name,
        email: registerForm.email,
        username: registerForm.username,
        contact: registerForm.contact,
        password: registerForm.password,
        password_confirmation: registerForm.confirmPassword,
        type: registerForm.type,
        gender: registerForm.gender,
        birth_date: registerForm.birthDate,
        zip_code: registerForm.zipCode,
        address: registerForm.address,
        district: registerForm.district,
        number: registerForm.number,
        city_name: registerForm.cityName,
        state_code: registerForm.stateCode,
        country_code: registerForm.countryCode,
        type_contact: registerForm.typeContact,
      }),
    });

    storeResult("authRegister", result);

    if (result.ok) {
      persistBrowserTokens(result.payload);
      setRegisterErrors({});
      setAuthFeedback({
        tone: "success",
        message: getMessageFromPayload(result.payload, "Cadastro realizado."),
      });
      await loadSession();
      navigateTo("/chat");
    } else {
      setAuthFeedback({
        tone: "error",
        message: getMessageFromPayload(result.payload, "Falha ao cadastrar."),
      });
    }

    setBusyAction(null);
  }

  async function handleChallenge() {
    setBusyAction("challenge");
    setAuthFeedback(null);

    const result = await requestJson("/api/auth/challenge", {
      method: "POST",
      body: JSON.stringify({
        channel: challengeForm.channel,
        identifier: challengeForm.identifier,
      }),
    });

    storeResult("authChallenge", result);

    if (result.ok) {
      syncChallengeIdentifier(result.payload);
      setAuthFeedback({
        tone: "info",
        message: getMessageFromPayload(
          result.payload,
          "Challenge iniciado com sucesso.",
        ),
      });
    } else {
      setAuthFeedback({
        tone: "error",
        message: getMessageFromPayload(
          result.payload,
          "Falha ao iniciar o challenge.",
        ),
      });
    }

    setBusyAction(null);
  }

  async function handleVerifyChallenge() {
    setBusyAction("verify");
    setAuthFeedback(null);

    const result = await requestJson("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: verifyForm.challengeId,
        code: verifyForm.code,
      }),
    });

    storeResult("authVerify", result);

    if (result.ok) {
      persistBrowserTokens(result.payload);
      setAuthFeedback({
        tone: "success",
        message: getMessageFromPayload(
          result.payload,
          "Challenge validado com sucesso.",
        ),
      });
      await loadSession();
      navigateTo("/chat");
    } else {
      setAuthFeedback({
        tone: "error",
        message: getMessageFromPayload(
          result.payload,
          "Falha ao validar o challenge.",
        ),
      });
    }

    setBusyAction(null);
  }

  async function handleRegisterBasic() {
    setBusyAction("register-basic");
    setAuthFeedback(null);

    const result = await requestJson("/api/auth/register/basic", {
      method: "POST",
      body: JSON.stringify({
        email: registerBasicForm.email,
        password: registerBasicForm.password,
        password_confirmation: registerBasicForm.confirmPassword,
        name: registerBasicForm.name,
        birth_date: registerBasicForm.birthDate,
        contact: registerBasicForm.contact,
      }),
    });

    storeResult("authRegisterBasic", result);

    if (result.ok) {
      persistBrowserTokens(result.payload);
      setAuthFeedback({
        tone: "success",
        message: getMessageFromPayload(
          result.payload,
          "Cadastro basico realizado com sucesso.",
        ),
      });
      await loadSession();

      if (readAuthTokens(result.payload).accessToken) {
        navigateTo("/chat");
      }
    } else {
      setAuthFeedback({
        tone: "error",
        message: getMessageFromPayload(
          result.payload,
          "Falha ao realizar o cadastro basico.",
        ),
      });
    }

    setBusyAction(null);
  }

  async function handleLogout() {
    setBusyAction("logout");
    setNotice(null);

    await requestJson("/api/auth/logout", {
      method: "POST",
    });

    clearBrowserTokens();
    setSession({
      authenticated: false,
      baseUrl: session.baseUrl,
      user: null,
    });
    setLiveChats([]);
    setThreadMessages(fallbackMessages);
    setResults({});
    setAuthMode("login");
    setAuthFeedback({
      tone: "info",
      message: "Sessao encerrada.",
    });
    navigateTo("/");
    setBusyAction(null);
  }

  useEffect(() => {
    if (session.authenticated && pathname === "/") {
      if (typeof window !== "undefined") {
        window.location.assign("/chat");
      }
      return;
    }

    if (pathname !== "/chat" || session.authenticated || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    async function restoreSessionFromBrowser() {
      const refreshToken = window.localStorage.getItem("helpdesk_refresh_token");
      const accessToken = window.localStorage.getItem("helpdesk_access_token");

      if (!refreshToken && !accessToken) {
        window.location.assign("/");
        return;
      }

      setIsRestoringSession(true);
      setNotice("Restaurando sessao salva no navegador...");

      const result = await requestJson("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify(
          refreshToken
            ? {
                refresh_token: refreshToken,
              }
            : {},
        ),
      });

      if (cancelled) {
        return;
      }

      setResults((current) => ({
        ...current,
        authRefresh: {
          status: result.status,
          payload: result.payload,
        },
      }));

      if (!result.ok) {
        clearBrowserTokens();
        window.location.assign("/");
        return;
      }

      persistBrowserTokens(result.payload);
      const sessionResult = await requestJson("/api/session");

      if (cancelled) {
        return;
      }

      if (sessionResult.ok && isRecord(sessionResult.payload)) {
        setSession(sessionResult.payload as SessionSnapshot);
        setNotice("Sessao restaurada com sucesso.");
      } else {
        clearBrowserTokens();
        window.location.assign("/");
        return;
      }

      setIsRestoringSession(false);
    }

    void restoreSessionFromBrowser();

    return () => {
      cancelled = true;
    };
  }, [pathname, session.authenticated]);

  async function handleResolveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("client-resolve");
    const result = await requestJson("/api/clients/contacts/resolve", {
      method: "POST",
      body: JSON.stringify({
        phone_number: resolveContactForm.phoneNumber,
        contact_name: resolveContactForm.contactName,
      }),
    });
    storeResult("clientResolve", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleClientRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("client-register");
    const result = await requestJson("/api/clients/register", {
      method: "POST",
      body: JSON.stringify({
        external_id: clientRegisterForm.externalId,
        name: clientRegisterForm.name,
        nickname: clientRegisterForm.nickname,
        contact_type: clientRegisterForm.contactType,
        contact_value: clientRegisterForm.contactValue,
        external_contact_id: clientRegisterForm.externalContactId,
      }),
    });
    storeResult("clientRegister", result);

    if (result.ok) {
      syncClientIdentifiers(result.payload);
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleBootstrapChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("chat-bootstrap");
    const result = await requestJson("/api/chats/bootstrap", {
      method: "POST",
      body: JSON.stringify({
        from: bootstrapChatForm.from,
        senderName: bootstrapChatForm.senderName,
        message: bootstrapChatForm.message,
      }),
    });
    storeResult("chatBootstrap", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
      await handleListChats();
    } else {
      setNotice(
        getMessageFromPayload(result.payload, "Falha ao abrir o chat inicial."),
      );
    }

    setBusyAction(null);
  }

  async function handleLoadMe() {
    setBusyAction("me");
    const result = await requestJson("/api/auth/me");
    storeResult("authMe", result);

    if (result.ok) {
      await loadSession();
      setNotice(getMessageFromPayload(result.payload, "Usuario carregado."));
    } else {
      setNotice(getMessageFromPayload(result.payload, "Falha ao consultar /auth/me."));
    }

    setBusyAction(null);
  }

  async function handleCompleteRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("register-complete");
    const result = await requestJson("/api/auth/register/complete", {
      method: "PUT",
      body: JSON.stringify({
        name: completeRegistrationForm.name,
        type: completeRegistrationForm.type,
        gender: completeRegistrationForm.gender,
        birth_date: completeRegistrationForm.birthDate,
        cpf_cnpj: completeRegistrationForm.cpfCnpj,
        zip_code: completeRegistrationForm.zipCode,
        address: completeRegistrationForm.address,
        district: completeRegistrationForm.district,
        number: completeRegistrationForm.number,
        city_name: completeRegistrationForm.cityName,
        state_code: completeRegistrationForm.stateCode,
        country_code: completeRegistrationForm.countryCode,
        type_contact: completeRegistrationForm.typeContact,
        contact: completeRegistrationForm.contact,
      }),
    });
    storeResult("authRegisterComplete", result);

    if (result.ok) {
      await loadSession();
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleRefresh() {
    setBusyAction("refresh");
    const result = await requestJson("/api/auth/refresh", {
      method: "POST",
    });
    storeResult("authRefresh", result);

    if (result.ok) {
      persistBrowserTokens(result.payload);
      await loadSession();
      setNotice(getMessageFromPayload(result.payload, "Sessao renovada."));
    } else {
      setNotice(getMessageFromPayload(result.payload, "Falha ao renovar a sessao."));
    }

    setBusyAction(null);
  }

  async function handleAttendantCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("attendant-create");
    const result = await requestJson("/api/attendants", {
      method: "POST",
      body: JSON.stringify({
        external_id: attendantForm.externalId,
        name: attendantForm.name,
        nickname: attendantForm.nickname,
        type: attendantForm.type,
      }),
    });
    storeResult("attendantCreate", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleAttendantUpdate() {
    setBusyAction("attendant-update");
    const result = await requestJson(
      `/api/attendants/${encodeURIComponent(attendantForm.externalId.trim())}`,
      {
        method: "PUT",
        body: JSON.stringify({
          external_id: attendantForm.externalId,
          name: attendantForm.name,
          nickname: attendantForm.nickname,
          type: attendantForm.type,
        }),
      },
    );
    storeResult("attendantUpdate", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleAttendantDelete() {
    setBusyAction("attendant-delete");
    const result = await requestJson(
      `/api/attendants/${encodeURIComponent(attendantForm.externalId.trim())}`,
      {
        method: "DELETE",
      },
    );
    storeResult("attendantDelete", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleClientCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("client-create");
    const result = await requestJson("/api/clients", {
      method: "POST",
      body: JSON.stringify({
        external_id: clientForm.externalId,
        name: clientForm.name,
        nickname: clientForm.nickname,
      }),
    });
    storeResult("clientCreate", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleClientUpdate() {
    setBusyAction("client-update");
    const result = await requestJson("/api/clients", {
      method: "PUT",
      body: JSON.stringify({
        id: clientForm.id,
        external_id: clientForm.externalId,
        name: clientForm.name,
        nickname: clientForm.nickname,
      }),
    });
    storeResult("clientUpdate", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleClientDelete() {
    setBusyAction("client-delete");
    const result = await requestJson(
      `/api/clients/${encodeURIComponent(clientForm.id.trim())}`,
      {
        method: "DELETE",
      },
    );
    storeResult("clientDelete", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleContactCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("contact-create");
    const result = await requestJson("/api/clients/contacts", {
      method: "POST",
      body: JSON.stringify({
        user_id: contactForm.userId,
        external_contact_id: contactForm.externalContactId,
        type: contactForm.type,
        value: contactForm.value,
      }),
    });
    storeResult("contactCreate", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleContactUpdate() {
    setBusyAction("contact-update");
    const result = await requestJson(
      `/api/clients/contacts/${encodeURIComponent(contactForm.contactId.trim())}`,
      {
        method: "PUT",
        body: JSON.stringify({
          value: contactForm.value,
        }),
      },
    );
    storeResult("contactUpdate", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleContactDelete() {
    setBusyAction("contact-delete");
    const result = await requestJson(
      `/api/clients/contacts/${encodeURIComponent(contactForm.contactId.trim())}`,
      {
        method: "DELETE",
      },
    );
    storeResult("contactDelete", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleListChats() {
    setBusyAction("chats-list");
    const result = await requestJson(
      `/api/chats?activeChannel=${encodeURIComponent(chatForm.activeChannel)}&perPage=${encodeURIComponent(chatForm.perPage)}`,
    );
    storeResult("chatsList", result);

    if (result.ok) {
      const nextChats = normalizeChats(result.payload);
      setLiveChats(nextChats);

      if (nextChats[0]) {
        const preferredChat =
          nextChats.find((chat) => chat.id === chatForm.chatId) ?? nextChats[0];

        setChatForm((current) => ({
          ...current,
          chatId: current.chatId || preferredChat.id,
          participantIds:
            current.participantIds || preferredChat.participantId || "",
          activeChannel: preferredChat.channel || current.activeChannel,
        }));
        setOutboundMessageForm((current) => ({
          ...current,
          chatId: current.chatId || preferredChat.id,
          channel: preferredChat.channel || current.channel,
        }));
      }
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleSelectChat(chat: ChatSummary) {
    setChatForm((current) => ({
      ...current,
      chatId: chat.id,
      participantIds: chat.participantId || current.participantIds,
      activeChannel: chat.channel || current.activeChannel,
    }));
    setOutboundMessageForm((current) => ({
      ...current,
      chatId: chat.id,
      channel: chat.channel || current.channel,
    }));
    await handleLoadMessages(chat.id);
  }

  async function handleViewChat() {
    if (!chatForm.chatId.trim()) {
      setNotice("Informe um chatId para visualizar.");
      return;
    }

    setBusyAction("chat-view");
    const result = await requestJson(
      `/api/chats/${encodeURIComponent(chatForm.chatId.trim())}`,
    );
    storeResult("chatView", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
      const messages = normalizeMessages(result.payload);

      if (messages.length > 0) {
        setThreadMessages(messages);
      }
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleOpenWhatsAppSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("chat-whatsapp-session");
    const result = await requestJson("/api/chats/whatsapp/session", {
      method: "POST",
      body: JSON.stringify({
        phone_number: whatsAppSessionForm.phoneNumber,
        contact_name: whatsAppSessionForm.contactName,
      }),
    });
    storeResult("chatWhatsappSession", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
      setOutboundMessageForm((current) => ({
        ...current,
        channel: "whatsapp",
      }));
      await handleListChats();
    } else {
      setNotice(
        getMessageFromPayload(
          result.payload,
          "Falha ao abrir a sessao de WhatsApp.",
        ),
      );
    }

    setBusyAction(null);
  }

  async function handleDemoWhatsAppChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("demo-chat");

    const sessionResult = await requestJson("/api/chats/whatsapp/session", {
      method: "POST",
      body: JSON.stringify({
        phone_number: demoChatForm.phoneNumber,
        contact_name: demoChatForm.contactName,
      }),
    });
    storeResult("chatWhatsappSession", sessionResult);

    if (!sessionResult.ok) {
      setNotice(
        getMessageFromPayload(
          sessionResult.payload,
          "Falha ao abrir a sessao de WhatsApp.",
        ),
      );
      setBusyAction(null);
      return;
    }

    syncChatIdentifiers(sessionResult.payload);

    const chatId =
      findValueByKeys(sessionResult.payload, ["chat_id", "chatId", "id"]) ??
      chatForm.chatId;

    if (chatId === null || !String(chatId).trim()) {
      setNotice("A sessao abriu, mas a API nao retornou um chatId utilizavel.");
      setBusyAction(null);
      return;
    }

    const outboundResult = await requestJson("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({
        chat_id: String(chatId),
        channel: "whatsapp",
        type: "text",
        message: demoChatForm.message,
      }),
    });
    storeResult("messageSendOutbound", outboundResult);

    if (!outboundResult.ok) {
      setNotice(
        getMessageFromPayload(
          outboundResult.payload,
          "Falha ao enviar a mensagem de demonstracao.",
        ),
      );
      setBusyAction(null);
      return;
    }

    setWhatsAppSessionForm({
      phoneNumber: demoChatForm.phoneNumber,
      contactName: demoChatForm.contactName,
    });
    setOutboundMessageForm((current) => ({
      ...current,
      chatId: String(chatId),
      channel: "whatsapp",
      type: "text",
      message: "",
    }));
    setChatForm((current) => ({
      ...current,
      chatId: String(chatId),
      activeChannel: "whatsapp",
    }));

    await handleListChats();
    await handleLoadMessages(String(chatId));
    setNotice("Chat demonstrativo aberto e mensagem enviada com sucesso.");
    setBusyAction(null);
  }

  async function handleTransferChat() {
    if (!chatForm.chatId.trim()) {
      setNotice("Informe um chatId para transferir.");
      return;
    }

    setBusyAction("chat-transfer");
    const result = await requestJson(
      `/api/chats/${encodeURIComponent(chatForm.chatId.trim())}/transfer`,
      {
        method: "POST",
        body: JSON.stringify({
          to_attendent_id: chatForm.toAttendentId,
        }),
      },
    );
    storeResult("chatTransfer", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleLoadMessages(chatIdOverride?: string) {
    const targetChatId = (chatIdOverride ?? chatForm.chatId).trim();

    if (!targetChatId) {
      setNotice("Informe um chatId para listar as mensagens.");
      return;
    }

    setBusyAction("messages-list");
    const result = await requestJson(
      `/api/messages?chatId=${encodeURIComponent(targetChatId)}`,
    );
    storeResult("messagesList", result);

    if (result.ok) {
      const messages = normalizeMessages(result.payload);
      setThreadMessages(messages.length > 0 ? messages : fallbackMessages);
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleSendOutboundMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("message-send-outbound");
    const result = await requestJson("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({
        chat_id: outboundMessageForm.chatId || chatForm.chatId,
        channel: outboundMessageForm.channel,
        type: outboundMessageForm.type,
        message: outboundMessageForm.message,
        media: {
          url: outboundMessageForm.mediaUrl,
          caption: outboundMessageForm.caption,
          filename: outboundMessageForm.fileName,
        },
      }),
    });
    storeResult("messageSendOutbound", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
      const nextChatId =
        String(
          findValueByKeys(result.payload, ["chat_id", "chatId", "id"]) ??
            outboundMessageForm.chatId ??
            chatForm.chatId,
        ) || "";

      setOutboundMessageForm((current) => ({
        ...current,
        chatId: nextChatId,
        message: "",
        mediaUrl: "",
        caption: "",
        fileName: "",
      }));
      await handleLoadMessages();
      setNotice(
        getMessageFromPayload(
          result.payload,
          "Mensagem outbound enviada com sucesso.",
        ),
      );
    } else {
      setNotice(
        getMessageFromPayload(
          result.payload,
          "Falha ao enviar a mensagem outbound.",
        ),
      );
    }

    setBusyAction(null);
  }

  async function handleVerifyWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("webhook-verify");
    const result = await requestJson(
      `/api/webhooks/whatsapp?hub.mode=${encodeURIComponent(webhookVerifyForm.mode)}&hub.verify_token=${encodeURIComponent(webhookVerifyForm.verifyToken)}&hub.challenge=${encodeURIComponent(webhookVerifyForm.challenge)}`,
    );
    storeResult("webhookVerify", result);
    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleReceiveWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("webhook-receive");
    const result = await requestJson("/api/webhooks/whatsapp", {
      method: "POST",
      body: JSON.stringify(buildWebhookPayload(webhookReceiveForm)),
    });
    storeResult("webhookReceive", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
      await handleListChats();
    } else {
    setNotice(getMessageFromPayload(result.payload, "Falha ao processar o webhook."));
    }

    setBusyAction(null);
  }

  useEffect(() => {
    if (!session.authenticated) {
      inboxBootstrappedRef.current = false;
    }
  }, [session.authenticated]);

  useEffect(() => {
    if (!session.authenticated || pathname !== "/chat") {
      return;
    }

    if (inboxBootstrappedRef.current) {
      return;
    }

    inboxBootstrappedRef.current = true;

    let cancelled = false;

    async function preloadInbox() {
      setBusyAction("chats-list");

      const chatsResult = await requestJson(
        `/api/chats?activeChannel=${encodeURIComponent(chatForm.activeChannel)}&perPage=${encodeURIComponent(chatForm.perPage)}`,
      );

      if (cancelled) {
        return;
      }

      storeResult("chatsList", chatsResult);

      if (!chatsResult.ok) {
        setNotice(
          getMessageFromPayload(
            chatsResult.payload,
            "Falha ao carregar a listagem de chats.",
          ),
        );
        setBusyAction(null);
        return;
      }

      const nextChats = normalizeChats(chatsResult.payload);
      setLiveChats(nextChats);

      if (!nextChats[0]) {
        setThreadMessages(fallbackMessages);
        setNotice("Inbox carregado, mas sem conversas disponiveis.");
        setBusyAction(null);
        return;
      }

      const selectedChat =
        nextChats.find((chat) => chat.id === chatForm.chatId) ?? nextChats[0];

      setChatForm((current) => ({
        ...current,
        chatId: current.chatId || selectedChat.id,
        participantIds: current.participantIds || selectedChat.participantId || "",
        activeChannel: selectedChat.channel || current.activeChannel,
      }));
      setOutboundMessageForm((current) => ({
        ...current,
        chatId: current.chatId || selectedChat.id,
        channel: selectedChat.channel || current.channel,
      }));

      const messagesResult = await requestJson(
        `/api/messages?chatId=${encodeURIComponent(selectedChat.id)}`,
      );

      if (cancelled) {
        return;
      }

      storeResult("messagesList", messagesResult);

      if (messagesResult.ok) {
        const messages = normalizeMessages(messagesResult.payload);
        setThreadMessages(messages.length > 0 ? messages : fallbackMessages);
        setNotice("Inbox carregado com sucesso.");
      } else {
        setThreadMessages(fallbackMessages);
        setNotice(
          getMessageFromPayload(
            messagesResult.payload,
            "Chats carregados, mas nao foi possivel listar a thread inicial.",
          ),
        );
      }

      setBusyAction(null);
    }

    void preloadInbox();

    return () => {
      cancelled = true;
    };
  }, [chatForm.activeChannel, chatForm.chatId, chatForm.perPage, pathname, session.authenticated]);

  if (pathname === "/chat" && !hasMounted) {
    return (
      <RestoringSessionScreen message="Carregando a interface do chat e sincronizando o estado do navegador." />
    );
  }

  if (pathname === "/chat" && !session.authenticated && isRestoringSession) {
    return (
      <RestoringSessionScreen message="Validando os tokens salvos localmente e reabrindo a sessao da Helpdesk API." />
    );
  }

  if (!session.authenticated) {
    return (
      <AuthScreen
        busyAction={busyAction}
        challengeForm={challengeForm}
        feedback={authFeedback}
        loginErrors={loginErrors}
        loginForm={loginForm}
        mode={authMode}
        onChallenge={handleChallenge}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onRegisterBasic={handleRegisterBasic}
        onVerify={handleVerifyChallenge}
        registerBasicForm={registerBasicForm}
        registerErrors={registerErrors}
        registerForm={registerForm}
        setChallengeForm={setChallengeForm}
        setLoginForm={setLoginForm}
        setMode={setAuthMode}
        setRegisterBasicForm={setRegisterBasicForm}
        setRegisterForm={setRegisterForm}
        setVerifyForm={setVerifyForm}
        verifyForm={verifyForm}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1820px] flex-1 flex-col px-3 py-3 sm:px-5 sm:py-5">
      <header className="hidden">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-700">
              Helpdesk Front Office
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
              Operacao do helpdesk guiada pela API
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">
              Base URL ativa: <span className="font-semibold text-stone-700">{session.baseUrl}</span>. Os paineis abaixo espelham os fluxos de onboarding, atendimento e integracao expostos pelo backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[24px] border border-orange-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-stone-900">{userName}</p>
              <p className="mt-1 text-xs text-stone-500">{userEmail || "Sessao autenticada"}</p>
            </div>
            <button
              className={secondaryButtonClassName}
              disabled={busyAction === "refresh"}
              onClick={() => {
                void handleRefresh();
              }}
              type="button"
            >
              {busyAction === "refresh" ? "Atualizando..." : "Refresh token"}
            </button>
            <button
              className={primaryButtonClassName}
              disabled={busyAction === "logout"}
              onClick={() => {
                void handleLogout();
              }}
              type="button"
            >
              {busyAction === "logout" ? "Saindo..." : "Logout"}
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mt-6 rounded-[22px] border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            {notice}
          </div>
        ) : null}
      </header>

      <div className="grid flex-1 overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,250,245,0.96),rgba(255,242,229,0.96))] shadow-[0_50px_130px_rgba(194,65,12,0.15)] xl:grid-cols-[430px_minmax(0,1fr)_320px]">
        <aside className="border-b border-orange-100/80 bg-white/72 xl:border-b-0 xl:border-r">
          <div className="grid h-full min-h-[320px] lg:grid-cols-[88px_minmax(0,1fr)]">
            <div className="flex flex-row items-center justify-between gap-3 border-b border-orange-100/80 bg-[linear-gradient(180deg,rgba(255,244,233,0.96),rgba(255,238,221,0.94))] px-4 py-4 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-3 lg:py-6">
              <div className="flex items-center gap-3 lg:flex-col">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#f0b37f] to-[#d86a17] text-xl font-semibold text-white shadow-[0_16px_32px_rgba(216,106,23,0.28)]">
                  H.
                </div>
                <div className="lg:hidden">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                    Inbox
                  </p>
                  <p className="mt-1 text-sm text-stone-500">Painel de chats</p>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:flex-col">
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
                  disabled={busyAction === "chats-list"}
                  onClick={() => {
                    void handleListChats();
                  }}
                  title="Atualizar inbox"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <path d="M21 3v6h-6" />
                  </svg>
                </button>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
                  disabled={busyAction === "me"}
                  onClick={() => {
                    void handleLoadMe();
                  }}
                  title="Consultar perfil"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                    <path d="M4 20a8 8 0 0 1 16 0" />
                  </svg>
                </button>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
                  disabled={busyAction === "refresh"}
                  onClick={() => {
                    void handleRefresh();
                  }}
                  title="Renovar token"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M20 6v6h-6" />
                    <path d="M4 18v-6h6" />
                    <path d="M20 12a8 8 0 0 0-14.9-4" />
                    <path d="M4 12a8 8 0 0 0 14.9 4" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 lg:flex-col">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-orange-700 shadow-sm">
                  {getInitials(userName)}
                </div>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
                  disabled={busyAction === "logout"}
                  onClick={() => {
                    void handleLogout();
                  }}
                  title="Sair"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
                    Helpdesk Inbox
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                    Chats
                  </h1>
                </div>
                <span className="rounded-full bg-[#fff1e3] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-orange-700">
                  {filteredChats.length} ativos
                </span>
              </div>

              <label className="mt-6 block">
                <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white px-4 py-3 shadow-[0_16px_30px_rgba(0,0,0,0.05)]">
                  <svg
                    className="h-5 w-5 text-stone-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3-3" />
                  </svg>
                  <input
                    className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                    onChange={(event) => setChatSearch(event.target.value)}
                    placeholder="Buscar conversas..."
                    value={chatSearch}
                  />
                </div>
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-orange-100 bg-[#fff6ee] px-4 py-3">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Canal
                  </p>
                  <input
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-stone-900 outline-none"
                    onChange={(event) =>
                      setChatForm((current) => ({
                        ...current,
                        activeChannel: event.target.value,
                      }))
                    }
                    value={chatForm.activeChannel}
                  />
                </div>
                <div className="rounded-[24px] border border-orange-100 bg-[#fff6ee] px-4 py-3">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Per page
                  </p>
                  <input
                    className="mt-2 w-full bg-transparent text-sm font-semibold text-stone-900 outline-none"
                    onChange={(event) =>
                      setChatForm((current) => ({
                        ...current,
                        perPage: event.target.value,
                      }))
                    }
                    value={chatForm.perPage}
                  />
                </div>
              </div>

              <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <ChatItem
                      active={chat.id === chatForm.chatId}
                      chat={chat}
                      key={chat.id}
                      onClick={() => {
                        void handleSelectChat(chat);
                      }}
                    />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-orange-200 bg-[#fff8f1] px-5 py-8 text-sm leading-6 text-stone-500">
                    Nenhum chat carregado ainda. Atualize o inbox ou abra uma conversa no painel da direita digitando o numero do cliente.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-[28px] border border-orange-100 bg-[linear-gradient(180deg,#fff7ef,#fff2e5)] p-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Conexao ativa
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-900">{userName}</p>
                <p className="mt-1 break-all text-xs leading-5 text-stone-500">
                  {userEmail || session.baseUrl}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-[760px] flex-col bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(255,245,236,0.92)_40%,rgba(255,238,225,0.9)_100%)]">
          <header className="border-b border-orange-100/80 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f3bf91] to-[#d86a17] text-lg font-semibold text-white shadow-[0_18px_38px_rgba(216,106,23,0.24)]">
                  {getInitials(activeChat?.title || chatForm.chatId || "HC")}
                </div>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
                    Atendimento
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                    {activeChat?.title || "Selecione uma conversa"}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {activeChat
                      ? `${activeChat.channel} • Chat ID ${activeChat.id}`
                      : "Abra uma conversa no painel da direita ou clique em um chat da lista."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
                  disabled={busyAction === "chat-view" || !chatForm.chatId.trim()}
                  onClick={() => {
                    void handleViewChat();
                  }}
                  title="Visualizar chat"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-orange-200/80 bg-white text-stone-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
                  disabled={busyAction === "messages-list" || !chatForm.chatId.trim()}
                  onClick={() => {
                    void handleLoadMessages();
                  }}
                  title="Atualizar mensagens"
                  type="button"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <path d="M21 3v6h-6" />
                  </svg>
                </button>
              </div>
            </div>

            {notice ? (
              <div className="mt-4 rounded-[20px] border border-orange-200 bg-orange-50/90 px-4 py-3 text-sm text-orange-900">
                {notice}
              </div>
            ) : null}
          </header>

          <div className="flex flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,245,241,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="mb-6 flex justify-center">
                  <span className="rounded-full bg-stone-200/80 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    {activeChat?.updatedAt || "Hoje"}
                  </span>
                </div>

                <div className="space-y-5">
                  {renderedMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              </div>

              <form
                className="border-t border-orange-100/80 bg-white/92 p-4 sm:p-5"
                onSubmit={handleSendOutboundMessage}
              >
                <div className="rounded-[28px] border border-orange-200/70 bg-white px-3 py-3 shadow-[0_18px_40px_rgba(216,106,23,0.08)]">
                  <div className="flex items-end gap-3">
                    <button
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-[#fff4e7] text-orange-700 transition hover:bg-[#ffe8d1]"
                      disabled={busyAction === "messages-list" || !chatForm.chatId.trim()}
                      onClick={() => {
                        void handleLoadMessages();
                      }}
                      title="Atualizar thread"
                      type="button"
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </button>

                    <textarea
                      className="min-h-12 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-7 text-stone-900 outline-none placeholder:text-stone-400"
                      disabled={!chatForm.chatId.trim()}
                      onChange={(event) =>
                        setOutboundMessageForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                      placeholder={
                        chatForm.chatId.trim()
                          ? "Digite sua mensagem..."
                          : "Abra uma conversa para enviar mensagens."
                      }
                      rows={1}
                      value={outboundMessageForm.message}
                    />

                    <button
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#b84e0a] to-[#eb7b21] text-white shadow-[0_16px_28px_rgba(216,106,23,0.32)] transition hover:from-[#9f4206] hover:to-[#dd6f17] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        busyAction === "message-send-outbound" ||
                        !chatForm.chatId.trim() ||
                        !outboundMessageForm.message.trim()
                      }
                      type="submit"
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m5 12 14-7-4 7 4 7-14-7Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fff1e3] px-3 py-1 text-orange-700">
                      {outboundMessageForm.channel || chatForm.activeChannel}
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      {outboundMessageForm.type}
                    </span>
                  </div>
                  <span>Chat ID {chatForm.chatId || "aguardando"}</span>
                </div>
              </form>
            </div>
          </div>
        </section>

        <aside className="border-t border-orange-100/80 bg-white/76 p-5 sm:p-6 xl:border-t-0 xl:border-l">
          <div className="flex h-full flex-col gap-5">
            <div className="rounded-[32px] border border-orange-100 bg-[linear-gradient(180deg,#fff8f2,#fff0df)] p-5 text-center shadow-[0_18px_42px_rgba(216,106,23,0.1)]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#f3c299] via-[#e89352] to-[#b84e0a] text-2xl font-semibold text-white shadow-[0_22px_44px_rgba(216,106,23,0.28)]">
                {getInitials(activeChat?.title || demoChatForm.contactName || "HC")}
              </div>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
                {activeChat?.title || demoChatForm.contactName || "Novo contato"}
              </h3>
              <p className="mt-2 text-sm font-semibold text-orange-700">
                {activeChat?.channel || "WhatsApp"} • Conversa ativa
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-[24px] bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Chat ID
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-stone-900">
                    {chatForm.chatId || "Aguardando"}
                  </p>
                </div>
                <div className="rounded-[24px] bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Participante
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-stone-900">
                    {chatForm.participantIds || "Nao informado"}
                  </p>
                </div>
              </div>
            </div>

            <form
              className="rounded-[30px] border border-orange-100 bg-[#fff7ef] p-5 shadow-[0_16px_36px_rgba(216,106,23,0.08)]"
              onSubmit={handleDemoWhatsAppChat}
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
                Quick Start
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-stone-950">
                Digite o numero e envie
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Este fluxo abre ou reaproveita a sessao WhatsApp e envia a primeira mensagem no mesmo submit.
              </p>

              <div className="mt-5 grid gap-4">
                <Field label="Numero WhatsApp">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setDemoChatForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                    value={demoChatForm.phoneNumber}
                  />
                </Field>
                <Field label="Nome do contato">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setDemoChatForm((current) => ({
                        ...current,
                        contactName: event.target.value,
                      }))
                    }
                    value={demoChatForm.contactName}
                  />
                </Field>
                <Field label="Mensagem inicial">
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y`}
                    onChange={(event) =>
                      setDemoChatForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    value={demoChatForm.message}
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "demo-chat"}
                    type="submit"
                  >
                    {busyAction === "demo-chat"
                      ? "Abrindo chat..."
                      : "Abrir chat e enviar"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "chats-list"}
                    onClick={() => {
                      void handleListChats();
                    }}
                    type="button"
                  >
                    {busyAction === "chats-list" ? "Atualizando..." : "Atualizar inbox"}
                  </button>
                </div>
              </div>
            </form>

            <div className="rounded-[30px] border border-orange-100 bg-white/94 p-5 shadow-[0_16px_36px_rgba(216,106,23,0.07)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
                Operacao
              </p>

              <div className="mt-4 grid gap-4">
                <Field label="Transferir para atendente">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setChatForm((current) => ({
                        ...current,
                        toAttendentId: event.target.value,
                      }))
                    }
                    value={chatForm.toAttendentId}
                  />
                </Field>

                <div className="grid gap-3">
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "chat-transfer" || !chatForm.chatId.trim()}
                    onClick={() => {
                      void handleTransferChat();
                    }}
                    type="button"
                  >
                    {busyAction === "chat-transfer" ? "Transferindo..." : "Transferir chat"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "me"}
                    onClick={() => {
                      void handleLoadMe();
                    }}
                    type="button"
                  >
                    {busyAction === "me" ? "Consultando..." : "Consultar /auth/me"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "refresh"}
                    onClick={() => {
                      void handleRefresh();
                    }}
                    type="button"
                  >
                    {busyAction === "refresh" ? "Atualizando..." : "Refresh token"}
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 rounded-[30px] border border-orange-100 bg-[linear-gradient(180deg,#fffdfb,#fff3e6)] p-5 shadow-[0_16px_36px_rgba(216,106,23,0.06)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-orange-700">
                Atividade da API
              </p>

              <div className="mt-4 space-y-3">
                {recentResponses.length > 0 ? (
                  recentResponses.map((entry) => (
                    <div
                      className="rounded-[22px] border border-orange-100 bg-white/90 px-4 py-3"
                      key={entry.key}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-stone-900">
                          {entry.label}
                        </p>
                        <span className="rounded-full bg-[#2b1406] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-orange-100">
                          HTTP {entry.result.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-orange-200 bg-white/80 px-4 py-5 text-sm leading-6 text-stone-500">
                    As ultimas respostas dos endpoints aparecem aqui conforme voce autentica, abre chats e envia mensagens.
                  </div>
                )}
              </div>

              {recentResponses[0] ? (
                <div className="mt-4 rounded-[24px] bg-[#2b1406] p-4 text-xs text-orange-50">
                  <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(recentResponses[0].result.payload, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <aside className="hidden">
          <div className="h-full space-y-4 overflow-y-auto pr-1">
            <Section
              defaultOpen
              description="Os fluxos principais do front saem daqui: demonstrar envio por numero, cadastrar cliente com contato, disparar o primeiro inbound e levar a conversa para o inbox."
              title="Front Flows"
            >
              <div className="rounded-[24px] border border-orange-200 bg-white/90 p-4 shadow-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-orange-700">
                  Demo pronta
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-stone-950">
                  Digite um numero e envie uma mensagem
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Este fluxo abre ou reaproveita `POST /api/chats/whatsapp/session`
                  e depois envia `POST /api/messages/send` no mesmo submit.
                </p>
              </div>

              <form className="mt-5 grid gap-4" onSubmit={handleDemoWhatsAppChat}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Numero WhatsApp">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setDemoChatForm((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                      value={demoChatForm.phoneNumber}
                    />
                  </Field>
                  <Field label="Nome do contato">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setDemoChatForm((current) => ({
                          ...current,
                          contactName: event.target.value,
                        }))
                      }
                      value={demoChatForm.contactName}
                    />
                  </Field>
                </div>
                <Field label="Mensagem inicial">
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    onChange={(event) =>
                      setDemoChatForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    value={demoChatForm.message}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "demo-chat"}
                    type="submit"
                  >
                    {busyAction === "demo-chat"
                      ? "Abrindo chat..."
                      : "Abrir chat e enviar"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      setWhatsAppSessionForm({
                        phoneNumber: demoChatForm.phoneNumber,
                        contactName: demoChatForm.contactName,
                      });
                      setOutboundMessageForm((current) => ({
                        ...current,
                        channel: "whatsapp",
                        type: "text",
                        message: demoChatForm.message,
                      }));
                    }}
                    type="button"
                  >
                    Copiar para formularios
                  </button>
                </div>
              </form>

              <div className="rounded-[24px] border border-orange-100 bg-orange-50/70 p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-orange-700">
                  Jornada 1
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-stone-950">
                  Cadastrar cliente e contato no mesmo passo
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Usa `POST /api/clients/register` para deixar o cliente pronto
                  para atendimento sem montar as etapas manualmente.
                </p>
              </div>

              <form className="mt-5 grid gap-4" onSubmit={handleClientRegister}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="External ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientRegisterForm((current) => ({
                          ...current,
                          externalId: event.target.value,
                        }))
                      }
                      value={clientRegisterForm.externalId}
                    />
                  </Field>
                  <Field label="Name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientRegisterForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      value={clientRegisterForm.name}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nickname">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientRegisterForm((current) => ({
                          ...current,
                          nickname: event.target.value,
                        }))
                      }
                      value={clientRegisterForm.nickname}
                    />
                  </Field>
                  <Field label="Contact type">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientRegisterForm((current) => ({
                          ...current,
                          contactType: event.target.value,
                        }))
                      }
                      value={clientRegisterForm.contactType}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contact value">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientRegisterForm((current) => ({
                          ...current,
                          contactValue: event.target.value,
                        }))
                      }
                      value={clientRegisterForm.contactValue}
                    />
                  </Field>
                  <Field label="External contact ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientRegisterForm((current) => ({
                          ...current,
                          externalContactId: event.target.value,
                        }))
                      }
                      value={clientRegisterForm.externalContactId}
                    />
                  </Field>
                </div>
                <button
                  className={primaryButtonClassName}
                  disabled={busyAction === "client-register"}
                  type="submit"
                >
                  {busyAction === "client-register"
                    ? "Registrando..."
                    : "Register client flow"}
                </button>
              </form>

              <div className="mt-6 rounded-[24px] border border-orange-100 bg-orange-50/70 p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-orange-700">
                  Jornada 2
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-stone-950">
                  Simular o primeiro contato recebido
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Usa `POST /api/chats/bootstrap` para abrir a conversa como se
                  ela tivesse entrado por webhook.
                </p>
              </div>

              <form className="mt-5 grid gap-4" onSubmit={handleBootstrapChat}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="From">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setBootstrapChatForm((current) => ({
                          ...current,
                          from: event.target.value,
                        }))
                      }
                      value={bootstrapChatForm.from}
                    />
                  </Field>
                  <Field label="Sender name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setBootstrapChatForm((current) => ({
                          ...current,
                          senderName: event.target.value,
                        }))
                      }
                      value={bootstrapChatForm.senderName}
                    />
                  </Field>
                </div>
                <Field label="Initial message">
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    onChange={(event) =>
                      setBootstrapChatForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    value={bootstrapChatForm.message}
                  />
                </Field>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "chat-bootstrap"}
                  type="submit"
                >
                  {busyAction === "chat-bootstrap"
                    ? "Disparando..."
                    : "Bootstrap inbound chat"}
                </button>
              </form>
            </Section>

            <Section
              description="Crie, atualize e remova atendentes usando os endpoints documentados em Attendants."
              title="Registration Complete"
            >
              <form className="grid gap-4" onSubmit={handleCompleteRegistration}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.name}
                    />
                  </Field>
                  <Field label="CPF/CNPJ">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          cpfCnpj: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.cpfCnpj}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Type">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.type}
                    />
                  </Field>
                  <Field label="Gender">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          gender: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.gender}
                    />
                  </Field>
                  <Field label="Birth date">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          birthDate: event.target.value,
                        }))
                      }
                      type="date"
                      value={completeRegistrationForm.birthDate}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Zip code">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          zipCode: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.zipCode}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.address}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="District">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          district: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.district}
                    />
                  </Field>
                  <Field label="Number">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          number: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.number}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          cityName: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.cityName}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="State code">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          stateCode: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.stateCode}
                    />
                  </Field>
                  <Field label="Country code">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          countryCode: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.countryCode}
                    />
                  </Field>
                  <Field label="Type contact">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setCompleteRegistrationForm((current) => ({
                          ...current,
                          typeContact: event.target.value,
                        }))
                      }
                      value={completeRegistrationForm.typeContact}
                    />
                  </Field>
                </div>
                <Field label="Contact">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setCompleteRegistrationForm((current) => ({
                        ...current,
                        contact: event.target.value,
                      }))
                    }
                    value={completeRegistrationForm.contact}
                  />
                </Field>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "register-complete"}
                  type="submit"
                >
                  {busyAction === "register-complete"
                    ? "Completando..."
                    : "Complete registration"}
                </button>
              </form>
            </Section>

            <Section
              description="Crie, atualize e remova atendentes usando os endpoints documentados em Attendants."
              title="Attendants"
            >
              <form className="grid gap-4" onSubmit={handleAttendantCreate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="External ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setAttendantForm((current) => ({
                          ...current,
                          externalId: event.target.value,
                        }))
                      }
                      value={attendantForm.externalId}
                    />
                  </Field>
                  <Field label="Name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setAttendantForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      value={attendantForm.name}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nickname">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setAttendantForm((current) => ({
                          ...current,
                          nickname: event.target.value,
                        }))
                      }
                      value={attendantForm.nickname}
                    />
                  </Field>
                  <Field label="Type">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setAttendantForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      value={attendantForm.type}
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "attendant-create"}
                    type="submit"
                  >
                    {busyAction === "attendant-create" ? "Criando..." : "Create"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "attendant-update"}
                    onClick={() => {
                      void handleAttendantUpdate();
                    }}
                    type="button"
                  >
                    {busyAction === "attendant-update" ? "Atualizando..." : "Update"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "attendant-delete"}
                    onClick={() => {
                      void handleAttendantDelete();
                    }}
                    type="button"
                  >
                    {busyAction === "attendant-delete" ? "Removendo..." : "Delete"}
                  </button>
                </div>
              </form>
            </Section>

            <Section
              description="Onboarding manual do cliente quando voce precisa ajustar dados apos o fluxo combinado."
              title="Clients"
            >
              <form className="grid gap-4" onSubmit={handleClientCreate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Internal ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setClientForm((current) => ({
                          ...current,
                          id: event.target.value,
                        }))
                      }
                      value={clientForm.id}
                    />
                  </Field>
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
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
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
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "client-create"}
                    type="submit"
                  >
                    {busyAction === "client-create" ? "Criando..." : "Create"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "client-update"}
                    onClick={() => {
                      void handleClientUpdate();
                    }}
                    type="button"
                  >
                    {busyAction === "client-update" ? "Atualizando..." : "Update"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "client-delete"}
                    onClick={() => {
                      void handleClientDelete();
                    }}
                    type="button"
                  >
                    {busyAction === "client-delete" ? "Removendo..." : "Delete"}
                  </button>
                </div>
              </form>

              <form
                className="mt-6 grid gap-4 border-t border-orange-100 pt-6"
                onSubmit={handleResolveContact}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone number">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setResolveContactForm((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                      value={resolveContactForm.phoneNumber}
                    />
                  </Field>
                  <Field label="Contact name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setResolveContactForm((current) => ({
                          ...current,
                          contactName: event.target.value,
                        }))
                      }
                      value={resolveContactForm.contactName}
                    />
                  </Field>
                </div>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "client-resolve"}
                  type="submit"
                >
                  {busyAction === "client-resolve"
                    ? "Resolvendo..."
                    : "Resolve WhatsApp Contact"}
                </button>
              </form>
            </Section>

            <Section
              description="Gerencie os canais do cliente para manter telefone, WhatsApp e ids externos sincronizados."
              title="Client Contacts"
            >
              <form className="grid gap-4" onSubmit={handleContactCreate}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contact ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          contactId: event.target.value,
                        }))
                      }
                      value={contactForm.contactId}
                    />
                  </Field>
                  <Field label="User ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          userId: event.target.value,
                        }))
                      }
                      value={contactForm.userId}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="External contact ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          externalContactId: event.target.value,
                        }))
                      }
                      value={contactForm.externalContactId}
                    />
                  </Field>
                  <Field label="Type">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      value={contactForm.type}
                    />
                  </Field>
                </div>
                <Field label="Value">
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                    value={contactForm.value}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "contact-create"}
                    type="submit"
                  >
                    {busyAction === "contact-create" ? "Criando..." : "Create"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "contact-update"}
                    onClick={() => {
                      void handleContactUpdate();
                    }}
                    type="button"
                  >
                    {busyAction === "contact-update" ? "Atualizando..." : "Update"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "contact-delete"}
                    onClick={() => {
                      void handleContactDelete();
                    }}
                    type="button"
                  >
                    {busyAction === "contact-delete" ? "Removendo..." : "Delete"}
                  </button>
                </div>
              </form>

              <form
                className="mt-6 grid gap-4 border-t border-orange-100 pt-6"
                onSubmit={handleOpenWhatsAppSession}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone number">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWhatsAppSessionForm((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                      value={whatsAppSessionForm.phoneNumber}
                    />
                  </Field>
                  <Field label="Contact name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWhatsAppSessionForm((current) => ({
                          ...current,
                          contactName: event.target.value,
                        }))
                      }
                      value={whatsAppSessionForm.contactName}
                    />
                  </Field>
                </div>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "chat-whatsapp-session"}
                  type="submit"
                >
                  {busyAction === "chat-whatsapp-session"
                    ? "Abrindo..."
                    : "Open WhatsApp Session"}
                </button>
              </form>
            </Section>

            <Section
              description="Valide o callback do WhatsApp e simule payloads Meta diretamente pelo front operacional."
              title="Webhooks"
            >
              <form className="grid gap-4" onSubmit={handleVerifyWebhook}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Hub mode">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookVerifyForm((current) => ({
                          ...current,
                          mode: event.target.value,
                        }))
                      }
                      value={webhookVerifyForm.mode}
                    />
                  </Field>
                  <Field label="Verify token">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookVerifyForm((current) => ({
                          ...current,
                          verifyToken: event.target.value,
                        }))
                      }
                      value={webhookVerifyForm.verifyToken}
                    />
                  </Field>
                  <Field label="Challenge">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookVerifyForm((current) => ({
                          ...current,
                          challenge: event.target.value,
                        }))
                      }
                      value={webhookVerifyForm.challenge}
                    />
                  </Field>
                </div>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "webhook-verify"}
                  type="submit"
                >
                  {busyAction === "webhook-verify" ? "Validando..." : "Verify webhook"}
                </button>
              </form>

              <form className="mt-6 grid gap-4 border-t border-orange-100 pt-6" onSubmit={handleReceiveWebhook}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business account ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookReceiveForm((current) => ({
                          ...current,
                          businessAccountId: event.target.value,
                        }))
                      }
                      value={webhookReceiveForm.businessAccountId}
                    />
                  </Field>
                  <Field label="Phone number ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookReceiveForm((current) => ({
                          ...current,
                          phoneNumberId: event.target.value,
                        }))
                      }
                      value={webhookReceiveForm.phoneNumberId}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display phone number">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookReceiveForm((current) => ({
                          ...current,
                          displayPhoneNumber: event.target.value,
                        }))
                      }
                      value={webhookReceiveForm.displayPhoneNumber}
                    />
                  </Field>
                  <Field label="Contact name">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookReceiveForm((current) => ({
                          ...current,
                          contactName: event.target.value,
                        }))
                      }
                      value={webhookReceiveForm.contactName}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Sender">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookReceiveForm((current) => ({
                          ...current,
                          sender: event.target.value,
                        }))
                      }
                      value={webhookReceiveForm.sender}
                    />
                  </Field>
                  <Field label="Message ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setWebhookReceiveForm((current) => ({
                          ...current,
                          messageId: event.target.value,
                        }))
                      }
                      value={webhookReceiveForm.messageId}
                    />
                  </Field>
                </div>
                <Field label="Message body">
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    onChange={(event) =>
                      setWebhookReceiveForm((current) => ({
                        ...current,
                        messageBody: event.target.value,
                      }))
                    }
                    value={webhookReceiveForm.messageBody}
                  />
                </Field>
                <button
                  className={primaryButtonClassName}
                  disabled={busyAction === "webhook-receive"}
                  type="submit"
                >
                  {busyAction === "webhook-receive" ? "Processando..." : "Receive webhook"}
                </button>
              </form>
            </Section>

            <Section
              description="Inspecione os retornos mais recentes de cada endpoint integrado."
              title="API Responses"
            >
              <div className="space-y-4">
                {resultOrder
                  .filter((entry) => results[entry.key])
                  .map((entry) => (
                    <JsonPanel
                      key={entry.key}
                      result={results[entry.key]!}
                      title={entry.label}
                    />
                  ))}
                {resultOrder.every((entry) => !results[entry.key]) ? (
                  <div className="rounded-[24px] border border-dashed border-orange-200 bg-orange-50/60 px-4 py-5 text-sm text-stone-500">
                    Nenhuma resposta capturada ainda.
                  </div>
                ) : null}
              </div>
            </Section>
          </div>
        </aside>
      </div>
    </main>
  );
}
