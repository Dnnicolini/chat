import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  REFRESH_COOKIE,
  applyTokenCookies,
  backendRequest,
  getErrorMessage,
  persistTokens,
  readTokenPayload,
} from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { refresh_token?: unknown }
    | null;

  const cookieStore = await cookies();
  const refreshToken =
    typeof payload?.refresh_token === "string" && payload.refresh_token.trim()
      ? payload.refresh_token.trim()
      : cookieStore.get(REFRESH_COOKIE)?.value ?? "";

  if (!refreshToken) {
    return NextResponse.json(
      {
        message: "Refresh token nao encontrado.",
      },
      { status: 401 },
    );
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
    return NextResponse.json(
      {
        message: getErrorMessage(refreshed.data, "Falha ao renovar a sessao."),
        details: refreshed.data,
      },
      { status: refreshed.status },
    );
  }

  await persistTokens(refreshed.data);
  const tokens = readTokenPayload(refreshed.data);
  const me = tokens.accessToken
    ? await backendRequest("/auth/me", { method: "GET" }, tokens.accessToken)
    : null;

  const response = NextResponse.json({
    message: "Sessao renovada com sucesso.",
    user: me?.ok ? me.data : null,
    auth: refreshed.data,
  });

  applyTokenCookies(response, refreshed.data);
  return response;
}
