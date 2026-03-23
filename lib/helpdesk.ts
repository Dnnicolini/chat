import { cookies } from "next/headers";

export const ACCESS_COOKIE = "helpdesk_access_token";
export const REFRESH_COOKIE = "helpdesk_refresh_token";

type BackendResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | { message: string } | null;
};

export type SessionSnapshot = {
  authenticated: boolean;
  baseUrl: string;
  user: unknown | null;
  error?: string;
};

type TokenPayload = {
  accessToken: string | null;
  refreshToken: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getHelpdeskBaseUrl() {
  return (process.env.HELPDESK_API_URL ?? "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function readTokenPayload(payload: unknown): TokenPayload {
  if (!isRecord(payload)) {
    return {
      accessToken: null,
      refreshToken: null,
    };
  }

  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token : null;
  const refreshToken =
    typeof payload.refresh_token === "string" ? payload.refresh_token : null;

  return {
    accessToken,
    refreshToken,
  };
}

export async function backendRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
) {
  const headers = new Headers(init.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${getHelpdeskBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    return {
      ok: response.ok,
      status: response.status,
      data: data as T | null,
    } satisfies BackendResult<T>;
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel conectar ao backend do Helpdesk.",
      } as T,
    } satisfies BackendResult<T>;
  }
}

export async function persistTokens(payload: unknown) {
  const cookieStore = await cookies();
  const tokens = readTokenPayload(payload);

  if (tokens.accessToken) {
    cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
      ...getCookieOptions(),
      maxAge: 60 * 60,
    });
  }

  if (tokens.refreshToken) {
    cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
      ...getCookieOptions(),
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function authorizedRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return {
      ok: false,
      status: 401,
      data: { message: "Sessao nao encontrada." },
    } satisfies BackendResult<T>;
  }

  let result = accessToken
    ? await backendRequest<T>(path, init, accessToken)
    : ({
        ok: false,
        status: 401,
        data: { message: "Access token ausente." },
      } satisfies BackendResult<T>);

  if (result.status !== 401 || !refreshToken) {
    return result;
  }

  const refreshed = await backendRequest("/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!refreshed.ok) {
    await clearTokens();
    return result;
  }

  await persistTokens(refreshed.data);
  const nextTokens = readTokenPayload(refreshed.data);

  if (!nextTokens.accessToken) {
    await clearTokens();
    return result;
  }

  result = await backendRequest<T>(path, init, nextTokens.accessToken);
  return result;
}

export async function getSessionSnapshot(): Promise<SessionSnapshot> {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.has(ACCESS_COOKIE) || cookieStore.has(REFRESH_COOKIE);

  if (!hasSession) {
    return {
      authenticated: false,
      baseUrl: getHelpdeskBaseUrl(),
      user: null,
    };
  }

  const me = await authorizedRequest("/auth/me");

  if (me.ok) {
    return {
      authenticated: true,
      baseUrl: getHelpdeskBaseUrl(),
      user: me.data,
    };
  }

  if (me.status === 401) {
    await clearTokens();

    return {
      authenticated: false,
      baseUrl: getHelpdeskBaseUrl(),
      user: null,
    };
  }

  return {
    authenticated: true,
    baseUrl: getHelpdeskBaseUrl(),
    user: null,
    error: getErrorMessage(me.data, "Nao foi possivel consultar /auth/me."),
  };
}

export function getErrorMessage(
  payload: unknown,
  fallback = "Nao foi possivel concluir a requisicao.",
) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const candidateKeys = ["message", "error", "detail", "details"];

  for (const key of candidateKeys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function findValueByKeys(
  payload: unknown,
  keys: Set<string>,
): string | number | null {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const match = findValueByKeys(item, keys);

      if (match !== null) {
        return match;
      }
    }

    return null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (
      keys.has(key.toLowerCase()) &&
      (typeof value === "string" || typeof value === "number")
    ) {
      return value;
    }
  }

  for (const value of Object.values(payload)) {
    const match = findValueByKeys(value, keys);

    if (match !== null) {
      return match;
    }
  }

  return null;
}

export function getNumericField(payload: unknown, keys: string[]) {
  const match = findValueByKeys(
    payload,
    new Set(keys.map((key) => key.toLowerCase())),
  );

  if (typeof match === "number" && Number.isFinite(match)) {
    return match;
  }

  if (typeof match === "string" && /^\d+$/.test(match)) {
    return Number(match);
  }

  return null;
}

export function getStringField(payload: unknown, keys: string[]) {
  const match = findValueByKeys(
    payload,
    new Set(keys.map((key) => key.toLowerCase())),
  );

  if (typeof match === "string" && match.trim()) {
    return match;
  }

  if (typeof match === "number" && Number.isFinite(match)) {
    return String(match);
  }

  return null;
}
