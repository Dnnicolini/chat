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
    | {
        challenge_id?: unknown;
        code?: unknown;
      }
    | null;

  const challengeId =
    typeof payload?.challenge_id === "string" ? payload.challenge_id.trim() : "";
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";

  if (!challengeId || !code) {
    return NextResponse.json(
      {
        message: "Informe challenge_id e code para validar o OTP.",
      },
      { status: 400 },
    );
  }

  const verified = await backendRequest("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challenge_id: challengeId,
      code,
    }),
  });

  if (!verified.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(verified.data, "Falha ao validar o challenge."),
        details: verified.data,
      },
      { status: verified.status },
    );
  }

  await persistTokens(verified.data);
  const tokens = readTokenPayload(verified.data);
  const me = tokens.accessToken
    ? await backendRequest("/auth/me", { method: "GET" }, tokens.accessToken)
    : null;

  const response = NextResponse.json({
    message: "Challenge validado com sucesso.",
    user: me?.ok ? me.data : null,
    auth: verified.data,
  });

  applyTokenCookies(response, verified.data);
  return response;
}
