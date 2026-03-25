import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

type RouteParams = {
  params: Promise<{ contactId: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const { contactId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | { value?: unknown }
    | null;

  const value = typeof payload?.value === "string" ? payload.value.trim() : "";

  if (!contactId.trim() || !value) {
    return NextResponse.json(
      {
        message: "Informe contactId e value para atualizar o contato.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/client/contact/${encodeURIComponent(contactId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value,
      }),
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao atualizar o contato."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Contato atualizado com sucesso.",
    data: result.data,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { contactId } = await params;

  if (!contactId.trim()) {
    return NextResponse.json(
      {
        message: "Informe o contactId.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/client/contact/${encodeURIComponent(contactId)}`,
    {
      method: "DELETE",
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao remover o contato."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Contato removido com sucesso.",
    data: result.data,
  });
}
