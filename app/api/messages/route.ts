import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId")?.trim();

  if (!chatId) {
    return NextResponse.json(
      {
        message: "Informe um chatId.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/messages?chat_id=${encodeURIComponent(chatId)}`,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao listar mensagens."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Mensagens carregadas.",
    data: result.data,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        message?: unknown;
        channel?: unknown;
        type?: unknown;
        participant_ids?: unknown;
      }
    | null;

  const message =
    typeof payload?.message === "string" ? payload.message.trim() : "";
  const channel =
    typeof payload?.channel === "string" && payload.channel.trim()
      ? payload.channel.trim()
      : "web";
  const type =
    typeof payload?.type === "string" && payload.type.trim()
      ? payload.type.trim()
      : "text";
  const participantIds = Array.isArray(payload?.participant_ids)
    ? payload.participant_ids
        .map((value) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            return value;
          }

          if (typeof value === "string" && /^\d+$/.test(value.trim())) {
            return Number(value.trim());
          }

          return null;
        })
        .filter((value): value is number => value !== null)
    : [];

  if (!message || participantIds.length === 0) {
    return NextResponse.json(
      {
        message: "Informe a mensagem e pelo menos um participant_id.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/messages/receive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      channel,
      type,
      participant_ids: participantIds,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao enviar mensagem."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Mensagem enviada.",
    data: result.data,
  });
}
