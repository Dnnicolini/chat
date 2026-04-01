import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        chat_id?: unknown;
        channel?: unknown;
        type?: unknown;
        message?: unknown;
        media?: {
          url?: unknown;
          caption?: unknown;
          filename?: unknown;
        } | null;
      }
    | null;

  const chatId =
    typeof payload?.chat_id === "number" && Number.isFinite(payload.chat_id)
      ? payload.chat_id
      : typeof payload?.chat_id === "string" && /^\d+$/.test(payload.chat_id.trim())
        ? Number(payload.chat_id.trim())
        : null;
  const channel =
    typeof payload?.channel === "string" && payload.channel.trim()
      ? payload.channel.trim()
      : "web";
  const type =
    typeof payload?.type === "string" && payload.type.trim()
      ? payload.type.trim()
      : "text";
  const message =
    typeof payload?.message === "string" ? payload.message.trim() : "";
  const mediaUrl =
    typeof payload?.media?.url === "string" ? payload.media.url.trim() : "";
  const mediaCaption =
    typeof payload?.media?.caption === "string"
      ? payload.media.caption.trim()
      : "";
  const mediaFilename =
    typeof payload?.media?.filename === "string"
      ? payload.media.filename.trim()
      : "";

  if (chatId === null) {
    return NextResponse.json(
      {
        message: "Informe o chat_id para enviar mensagem outbound.",
      },
      { status: 400 },
    );
  }

  if (type === "text" && !message) {
    return NextResponse.json(
      {
        message: "Informe a mensagem de texto para envio outbound.",
      },
      { status: 400 },
    );
  }

  if (type !== "text" && !mediaUrl) {
    return NextResponse.json(
      {
        message: "Informe media.url para enviar mensagem de midia.",
      },
      { status: 400 },
    );
  }

  if (type === "document" && !mediaFilename) {
    return NextResponse.json(
      {
        message: "Informe media.filename para enviar um document.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      channel,
      type,
      message: message || undefined,
      media:
        mediaUrl || mediaCaption || mediaFilename
          ? {
              url: mediaUrl || undefined,
              caption: mediaCaption || undefined,
              filename: mediaFilename || undefined,
            }
          : undefined,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao enviar mensagem outbound."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Mensagem outbound enviada com sucesso.",
    data: result.data,
  });
}
