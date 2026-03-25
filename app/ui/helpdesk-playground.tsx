"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
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
  | "authLogin"
  | "authRegister"
  | "authMe"
  | "authRefresh"
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

type AttendantFormState = {
  externalId: string;
  name: string;
  nickname: string;
  type: string;
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
  { key: "authLogin", label: "Auth / Login" },
  { key: "authRegister", label: "Auth / Register" },
  { key: "authMe", label: "Auth / Me" },
  { key: "authRefresh", label: "Auth / Refresh" },
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function splitParticipantIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
      className={`w-full rounded-[26px] border p-4 text-left transition ${
        active
          ? "border-orange-200 bg-white shadow-[0_18px_40px_rgba(249,115,22,0.12)]"
          : "border-transparent bg-white/50 hover:border-orange-100 hover:bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-sm font-semibold text-white">
          {getInitials(chat.title || chat.id)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-stone-950">
                {chat.title}
              </p>
              <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-orange-600">
                {chat.channel}
              </p>
            </div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-400">
              {chat.updatedAt}
            </span>
          </div>
          <p className="mt-2 truncate text-sm text-stone-500">{chat.preview}</p>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  const outgoing = message.side === "outgoing";

  return (
    <div className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[88%]">
        <div
          className={`rounded-[24px] px-5 py-4 shadow-[0_18px_34px_rgba(0,0,0,0.06)] ${
            outgoing
              ? "bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 text-white"
              : "bg-[#ececec] text-stone-800"
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
    </div>
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
  setMode: (value: AuthMode) => void;
  loginForm: LoginFormState;
  setLoginForm: (value: LoginFormState) => void;
  registerForm: RegisterFormState;
  setRegisterForm: (value: RegisterFormState) => void;
  loginErrors: Record<string, string | undefined>;
  registerErrors: Record<string, string | undefined>;
  feedback: { tone: FeedbackTone; message: string } | null;
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
    <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1460px] flex-1 items-center px-3 py-3 sm:px-5 sm:py-5">
      <section className="grid w-full overflow-hidden rounded-[34px] border border-orange-200/60 bg-white shadow-[0_40px_120px_rgba(194,65,12,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#c75b14_0%,#f97316_55%,#ff7a1a_100%)] px-8 py-10 text-white sm:px-12 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.16),transparent_38%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight">Helpdesk API</p>
              <p className="mt-3 text-sm text-orange-50/84">
                Console BFF para Login, Register, Chats, Clients e Webhooks.
              </p>
            </div>

            <div className="max-w-md py-10 lg:py-0">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-100/85">
                Integracao completa
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Autentique, cadastre e valide os fluxos reais da Helpdesk API.
              </h1>
              <p className="mt-5 text-base leading-8 text-orange-50/92">
                O cadastro agora usa `POST /auth/register` e a area autenticada
                expõe os grupos documentados na colecao Postman.
              </p>
            </div>

            <div className="hidden text-sm text-orange-100/70 lg:block">
              Next 16 App Router • Cookie session • Endpoint-by-endpoint testing
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
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  const filteredChats = liveChats.filter((chat) => {
    const haystack = `${chat.title} ${chat.preview} ${chat.channel}`.toLowerCase();
    return haystack.includes(chatSearch.toLowerCase());
  });

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
        setChatForm((current) => ({
          ...current,
          chatId: current.chatId || nextChats[0].id,
          participantIds:
            current.participantIds || nextChats[0].participantId || "",
        }));
      }
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
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

  async function handleCreateChat() {
    setBusyAction("chat-create");
    const result = await requestJson("/api/chats", {
      method: "POST",
      body: JSON.stringify({
        participant_ids: splitParticipantIds(chatForm.participantIds),
        active_channel: chatForm.activeChannel,
      }),
    });
    storeResult("chatCreate", result);

    if (result.ok) {
      syncChatIdentifiers(result.payload);
      await handleListChats();
    } else {
      setNotice(getMessageFromPayload(result.payload, "Falha ao criar o chat."));
    }

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

  async function handleLoadMessages() {
    if (!chatForm.chatId.trim()) {
      setNotice("Informe um chatId para listar as mensagens.");
      return;
    }

    setBusyAction("messages-list");
    const result = await requestJson(
      `/api/messages?chatId=${encodeURIComponent(chatForm.chatId.trim())}`,
    );
    storeResult("messagesList", result);

    if (result.ok) {
      const messages = normalizeMessages(result.payload);
      setThreadMessages(messages.length > 0 ? messages : fallbackMessages);
    }

    setNotice(getMessageFromPayload(result.payload, "Operacao concluida."));
    setBusyAction(null);
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("message-send");
    const result = await requestJson("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        message: chatForm.outboundMessage,
        channel: chatForm.messageChannel,
        type: chatForm.messageType,
        participant_ids: splitParticipantIds(chatForm.participantIds),
      }),
    });
    storeResult("messageSend", result);

    if (result.ok) {
      await handleLoadMessages();
      setChatForm((current) => ({
        ...current,
        outboundMessage: "",
      }));
    } else {
      setNotice(getMessageFromPayload(result.payload, "Falha ao enviar a mensagem."));
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

  if (pathname === "/chat" && !session.authenticated && isRestoringSession) {
    return (
      <RestoringSessionScreen message="Validando os tokens salvos localmente e reabrindo a sessao da Helpdesk API." />
    );
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
        onRegister={handleRegister}
        registerErrors={registerErrors}
        registerForm={registerForm}
        setLoginForm={setLoginForm}
        setMode={setAuthMode}
        setRegisterForm={setRegisterForm}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1740px] flex-1 flex-col px-3 py-3 sm:px-5 sm:py-5">
      <header className={`${shellPanelClassName} p-6 sm:p-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-700">
              Helpdesk API Workspace
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">
              Console integrado com a colecao Postman
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-500">
              Base URL ativa: <span className="font-semibold text-stone-700">{session.baseUrl}</span>
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

      <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)_440px]">
        <aside className={`p-5 sm:p-6 ${shellPanelClassName}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
                Chats
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                Inbox
              </h2>
            </div>
            <button
              className={secondaryButtonClassName}
              disabled={busyAction === "chats-list"}
              onClick={() => {
                void handleListChats();
              }}
              type="button"
            >
              {busyAction === "chats-list" ? "Carregando..." : "Listar"}
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Active channel">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setChatForm((current) => ({
                      ...current,
                      activeChannel: event.target.value,
                    }))
                  }
                  value={chatForm.activeChannel}
                />
              </Field>
              <Field label="Per page">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    setChatForm((current) => ({
                      ...current,
                      perPage: event.target.value,
                    }))
                  }
                  value={chatForm.perPage}
                />
              </Field>
            </div>

            <label className="block">
              <div className="flex items-center gap-3 rounded-full bg-white px-5 py-4 shadow-sm ring-1 ring-orange-100">
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
                  className="w-full bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400"
                  onChange={(event) => setChatSearch(event.target.value)}
                  placeholder="Buscar chats..."
                  value={chatSearch}
                />
              </div>
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <ChatItem
                  active={chat.id === chatForm.chatId}
                  chat={chat}
                  key={chat.id}
                  onClick={() => {
                    setChatForm((current) => ({
                      ...current,
                      chatId: chat.id,
                      participantIds: chat.participantId || current.participantIds,
                    }));
                  }}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-orange-200 bg-white/70 px-4 py-6 text-sm text-stone-500">
                Nenhum chat carregado. Use `Chats / List` para popular a lista.
              </div>
            )}
          </div>
        </aside>

        <section className={`flex min-h-[780px] flex-col overflow-hidden ${shellPanelClassName}`}>
          <header className="border-b border-orange-100 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-600 text-lg font-semibold text-white shadow-sm">
                  {getInitials(chatForm.chatId || "HC")}
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                    Chat {chatForm.chatId || "selecionado"}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Participant IDs: {chatForm.participantIds || "nao informado"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "chat-view"}
                  onClick={() => {
                    void handleViewChat();
                  }}
                  type="button"
                >
                  {busyAction === "chat-view" ? "Abrindo..." : "View chat"}
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={busyAction === "messages-list"}
                  onClick={() => {
                    void handleLoadMessages();
                  }}
                  type="button"
                >
                  {busyAction === "messages-list" ? "Listando..." : "List messages"}
                </button>
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-4 bg-[linear-gradient(180deg,#f5f3f1,#fcfcfc)] px-4 py-4 sm:px-7 sm:py-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className={`${cardClassName} space-y-4`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Chat ID">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setChatForm((current) => ({
                          ...current,
                          chatId: event.target.value,
                        }))
                      }
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="To attendent id">
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
                  <Field label="Create chat with channel">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setChatForm((current) => ({
                          ...current,
                          activeChannel: event.target.value,
                        }))
                      }
                      value={chatForm.activeChannel}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "chat-create"}
                    onClick={() => {
                      void handleCreateChat();
                    }}
                    type="button"
                  >
                    {busyAction === "chat-create" ? "Criando..." : "Create chat"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "chat-transfer"}
                    onClick={() => {
                      void handleTransferChat();
                    }}
                    type="button"
                  >
                    {busyAction === "chat-transfer" ? "Transferindo..." : "Transfer chat"}
                  </button>
                </div>
              </div>

              <div className={cardClassName}>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-orange-700">
                  Session actions
                </p>
                <div className="mt-5 grid gap-3">
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "session"}
                    onClick={() => {
                      void loadSession();
                    }}
                    type="button"
                  >
                    Recarregar sessao
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
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <span className="rounded-full bg-stone-200/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                Mensagens
              </span>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-1">
              {(threadMessages.length > 0 ? threadMessages : fallbackMessages).map(
                (message) => (
                  <MessageBubble key={message.id} message={message} />
                ),
              )}
            </div>

            <form className={cardClassName} onSubmit={handleSendMessage}>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Message channel">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setChatForm((current) => ({
                          ...current,
                          messageChannel: event.target.value,
                        }))
                      }
                      value={chatForm.messageChannel}
                    />
                  </Field>
                  <Field label="Message type">
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        setChatForm((current) => ({
                          ...current,
                          messageType: event.target.value,
                        }))
                      }
                      value={chatForm.messageType}
                    />
                  </Field>
                </div>

                <Field label="Outbound message">
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y`}
                    onChange={(event) =>
                      setChatForm((current) => ({
                        ...current,
                        outboundMessage: event.target.value,
                      }))
                    }
                    value={chatForm.outboundMessage}
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={busyAction === "message-send"}
                    type="submit"
                  >
                    {busyAction === "message-send" ? "Enviando..." : "Send internal message"}
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={busyAction === "messages-list"}
                    onClick={() => {
                      void handleLoadMessages();
                    }}
                    type="button"
                  >
                    Recarregar thread
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <aside className={`p-5 sm:p-6 ${shellPanelClassName}`}>
          <div className="h-full space-y-4 overflow-y-auto pr-1">
            <Section
              defaultOpen
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
              description="Crie, atualize e exclua clientes pelo id interno retornado pela API."
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
              description="Use o user_id do cliente e o contactId retornado pela API para gerenciar contatos."
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
              description="Valide o callback do WhatsApp e simule payloads Meta diretamente pelo frontend."
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
