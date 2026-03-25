import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        external_id?: unknown;
        name?: unknown;
        nickname?: unknown;
        type?: unknown;
      }
    | null;

  const externalId =
    typeof payload?.external_id === "string" ? payload.external_id.trim() : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const nickname =
    typeof payload?.nickname === "string" ? payload.nickname.trim() : "";
  const type = typeof payload?.type === "string" ? payload.type.trim() : "";

  if (!externalId || !name || !type) {
    return NextResponse.json(
      {
        message: "Informe external_id, name e type para criar o atendente.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/create/attendent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: externalId,
      name,
      nickname: nickname || undefined,
      type,
    }),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao criar o atendente."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Atendente criado com sucesso.",
    data: result.data,
  });
}
