import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        user_id?: unknown;
        external_contact_id?: unknown;
        type?: unknown;
        value?: unknown;
      }
    | null;

  const userId =
    typeof payload?.user_id === "number" && Number.isFinite(payload.user_id)
      ? payload.user_id
      : typeof payload?.user_id === "string" &&
          /^\d+$/.test(payload.user_id.trim())
        ? Number(payload.user_id.trim())
        : null;
  const externalContactId =
    typeof payload?.external_contact_id === "string"
      ? payload.external_contact_id.trim()
      : "";
  const type = typeof payload?.type === "string" ? payload.type.trim() : "";
  const value = typeof payload?.value === "string" ? payload.value.trim() : "";

  if (userId === null || !externalContactId || !type || !value) {
    return NextResponse.json(
      {
        message:
          "Informe user_id, external_contact_id, type e value para criar o contato.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/client/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      external_contact_id: externalContactId,
      type,
      value,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao criar o contato."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Contato criado com sucesso.",
    data: result.data,
  });
}
