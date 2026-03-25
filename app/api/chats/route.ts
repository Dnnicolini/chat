import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeChannel = searchParams.get("activeChannel")?.trim() || "whatsapp";
  const perPage = searchParams.get("perPage")?.trim() || "10";

  const result = await authorizedRequest(
    `/chats?active_channel=${encodeURIComponent(activeChannel)}&per_page=${encodeURIComponent(perPage)}`,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao listar os chats."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Chats carregados com sucesso.",
    data: result.data,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        participant_ids?: unknown;
        active_channel?: unknown;
      }
    | null;

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
  const activeChannel =
    typeof payload?.active_channel === "string" &&
    payload.active_channel.trim()
      ? payload.active_channel.trim()
      : "whatsapp";

  if (participantIds.length === 0) {
    return NextResponse.json(
      {
        message: "Informe pelo menos um participant_id para criar o chat.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      participant_ids: participantIds,
      active_channel: activeChannel,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao criar o chat."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Chat criado com sucesso.",
    data: result.data,
  });
}
