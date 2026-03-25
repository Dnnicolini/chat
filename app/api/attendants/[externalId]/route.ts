import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

type RouteParams = {
  params: Promise<{ externalId: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  const { externalId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | {
        external_id?: unknown;
        name?: unknown;
        nickname?: unknown;
        type?: unknown;
      }
    | null;

  if (!externalId.trim()) {
    return NextResponse.json(
      {
        message: "Informe o externalId do atendente.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/update/attendent/${encodeURIComponent(externalId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id:
          typeof payload?.external_id === "string" && payload.external_id.trim()
            ? payload.external_id.trim()
            : undefined,
        name:
          typeof payload?.name === "string" && payload.name.trim()
            ? payload.name.trim()
            : undefined,
        nickname:
          typeof payload?.nickname === "string" && payload.nickname.trim()
            ? payload.nickname.trim()
            : undefined,
        type:
          typeof payload?.type === "string" && payload.type.trim()
            ? payload.type.trim()
            : undefined,
      }),
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao atualizar o atendente."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Atendente atualizado com sucesso.",
    data: result.data,
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { externalId } = await params;

  if (!externalId.trim()) {
    return NextResponse.json(
      {
        message: "Informe o externalId do atendente.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/delete/attendent/${encodeURIComponent(externalId)}`,
    {
      method: "DELETE",
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao remover o atendente."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Atendente removido com sucesso.",
    data: result.data,
  });
}
