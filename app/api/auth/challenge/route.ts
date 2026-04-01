import { NextResponse } from "next/server";
import {
  backendRequest,
  getErrorMessage,
  getStringField,
} from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        channel?: unknown;
        identifier?: unknown;
      }
    | null;

  const channel =
    typeof payload?.channel === "string" && payload.channel.trim()
      ? payload.channel.trim()
      : "email";
  const identifier =
    typeof payload?.identifier === "string" ? payload.identifier.trim() : "";

  if (!identifier) {
    return NextResponse.json(
      {
        message: "Informe o identifier para iniciar o challenge.",
      },
      { status: 400 },
    );
  }

  const result = await backendRequest("/auth/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      identifier,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao iniciar o challenge."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Challenge iniciado com sucesso.",
    challenge_id: getStringField(result.data, ["challenge_id"]),
    data: result.data,
  });
}
