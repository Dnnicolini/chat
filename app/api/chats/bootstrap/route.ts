import { NextResponse } from "next/server";
import { backendRequest, getErrorMessage } from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        from?: unknown;
        senderName?: unknown;
        message?: unknown;
      }
    | null;

  const from = typeof payload?.from === "string" ? payload.from.trim() : "";
  const senderName =
    typeof payload?.senderName === "string" ? payload.senderName.trim() : "";
  const message =
    typeof payload?.message === "string" ? payload.message.trim() : "";

  if (!from || !senderName || !message) {
    return NextResponse.json(
      {
        message: "Informe telefone, nome do remetente e mensagem inicial.",
      },
      { status: 400 },
    );
  }

  const result = await backendRequest("/webhooks/message/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      sender: {
        name: senderName,
      },
      message,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao criar o chat de teste."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Webhook enviado com sucesso.",
    data: result.data,
  });
}
