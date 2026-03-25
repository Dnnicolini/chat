import { NextResponse } from "next/server";
import {
  applyTokenCookies,
  backendRequest,
  getErrorMessage,
  persistTokens,
  readTokenPayload,
} from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { username?: unknown; password?: unknown }
    | null;

  const username =
    typeof payload?.username === "string" ? payload.username.trim() : "";
  const password =
    typeof payload?.password === "string" ? payload.password : "";

  if (!username || !password) {
    return NextResponse.json(
      {
        message: "Informe username e password.",
      },
      { status: 400 },
    );
  }

  const login = await backendRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!login.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(login.data, "Falha ao autenticar."),
        details: login.data,
      },
      { status: login.status },
    );
  }

  await persistTokens(login.data);
  const tokens = readTokenPayload(login.data);

  const me = tokens.accessToken
    ? await backendRequest("/auth/me", { method: "GET" }, tokens.accessToken)
    : null;

  const response = NextResponse.json({
    message: "Sessao iniciada com sucesso.",
    user: me?.ok ? me.data : null,
    auth: login.data,
  });

  applyTokenCookies(response, login.data);
  return response;
}
