import { NextResponse } from "next/server";
import {
  authorizedRequest,
  getErrorMessage,
  getNumericField,
} from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        external_id?: unknown;
        name?: unknown;
        nickname?: unknown;
        contact_type?: unknown;
        contact_value?: unknown;
        external_contact_id?: unknown;
      }
    | null;

  const externalId =
    typeof payload?.external_id === "string" ? payload.external_id.trim() : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const nickname =
    typeof payload?.nickname === "string" ? payload.nickname.trim() : "";
  const contactType =
    typeof payload?.contact_type === "string"
      ? payload.contact_type.trim()
      : "";
  const contactValue =
    typeof payload?.contact_value === "string"
      ? payload.contact_value.trim()
      : "";
  const externalContactId =
    typeof payload?.external_contact_id === "string"
      ? payload.external_contact_id.trim()
      : "";

  if (!externalId || !name) {
    return NextResponse.json(
      {
        message: "Informe external_id e name para registrar o cliente.",
      },
      { status: 400 },
    );
  }

  const client = await authorizedRequest("/client/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: externalId,
      name,
      nickname: nickname || undefined,
    }),
  });

  if (!client.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(client.data, "Falha ao cadastrar o cliente."),
        details: client.data,
      },
      { status: client.status },
    );
  }

  const clientId = getNumericField(client.data, ["id", "user_id", "client_id"]);

  if (!contactType || !contactValue || !externalContactId || clientId === null) {
    return NextResponse.json({
      message: clientId === null
        ? "Cliente criado, mas a API nao retornou id para criar contato automaticamente."
        : "Cliente criado com sucesso.",
      client: client.data,
      contact: null,
    });
  }

  const contact = await authorizedRequest("/client/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: clientId,
      external_contact_id: externalContactId,
      type: contactType,
      value: contactValue,
    }),
  });

  return NextResponse.json(
    {
      message: contact.ok
        ? "Cliente e contato criados com sucesso."
        : "Cliente criado, mas houve falha ao criar o contato.",
      client: client.data,
      contact: contact.data,
      contactError: contact.ok
        ? null
        : getErrorMessage(contact.data, "Falha ao criar contato."),
    },
    { status: contact.ok ? 200 : contact.status },
  );
}
