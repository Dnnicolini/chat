import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        external_id?: unknown;
        name?: unknown;
        nickname?: unknown;
      }
    | null;

  const externalId =
    typeof payload?.external_id === "string" ? payload.external_id.trim() : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const nickname =
    typeof payload?.nickname === "string" ? payload.nickname.trim() : "";

  if (!externalId || !name) {
    return NextResponse.json(
      {
        message: "Informe external_id e name para criar o cliente.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/client/create", {
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

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao criar o cliente."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Cliente criado com sucesso.",
    data: result.data,
  });
}

export async function PUT(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        id?: unknown;
        external_id?: unknown;
        name?: unknown;
        nickname?: unknown;
      }
    | null;

  const id =
    typeof payload?.id === "number" && Number.isFinite(payload.id)
      ? payload.id
      : typeof payload?.id === "string" && /^\d+$/.test(payload.id.trim())
        ? Number(payload.id.trim())
        : null;

  if (id === null) {
    return NextResponse.json(
      {
        message: "Informe o id interno do cliente para atualizar.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/client/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
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
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao atualizar o cliente."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Cliente atualizado com sucesso.",
    data: result.data,
  });
}
