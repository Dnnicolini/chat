import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        phone_number?: unknown;
        contact_name?: unknown;
      }
    | null;

  const phoneNumber =
    typeof payload?.phone_number === "string"
      ? payload.phone_number.trim()
      : "";
  const contactName =
    typeof payload?.contact_name === "string"
      ? payload.contact_name.trim()
      : "";

  if (!phoneNumber || !contactName) {
    return NextResponse.json(
      {
        message:
          "Informe phone_number e contact_name para abrir a sessao de WhatsApp.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/chats/whatsapp/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      contact_name: contactName,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(
          result.data,
          "Falha ao abrir a sessao de WhatsApp.",
        ),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Sessao de WhatsApp aberta com sucesso.",
    data: result.data,
  });
}
