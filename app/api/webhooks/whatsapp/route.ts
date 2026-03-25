import { NextResponse } from "next/server";
import { backendRequest, getErrorMessage } from "@/lib/helpdesk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode")?.trim() ?? "subscribe";
  const verifyToken = searchParams.get("hub.verify_token")?.trim() ?? "";
  const challenge = searchParams.get("hub.challenge")?.trim() ?? "";

  if (!verifyToken || !challenge) {
    return NextResponse.json(
      {
        message:
          "Informe hub.verify_token e hub.challenge para validar o webhook.",
      },
      { status: 400 },
    );
  }

  const result = await backendRequest(
    `/webhooks/message/whatsapp?hub.mode=${encodeURIComponent(mode)}&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=${encodeURIComponent(challenge)}`,
    {
      method: "GET",
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao validar o webhook."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Webhook validado com sucesso.",
    data: result.data,
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      {
        message: "Envie um payload valido para o webhook.",
      },
      { status: 400 },
    );
  }

  const result = await backendRequest("/webhooks/message/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao processar o webhook."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Webhook processado com sucesso.",
    data: result.data,
  });
}
