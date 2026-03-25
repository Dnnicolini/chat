import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

type RouteParams = {
  params: Promise<{ chatId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { chatId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | { to_attendent_id?: unknown }
    | null;

  const toAttendentId =
    typeof payload?.to_attendent_id === "string"
      ? payload.to_attendent_id.trim()
      : "";

  if (!chatId.trim() || !toAttendentId) {
    return NextResponse.json(
      {
        message: "Informe chatId e to_attendent_id para transferir o chat.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/chats/${encodeURIComponent(chatId)}/transfer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to_attendent_id: toAttendentId,
      }),
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao transferir o chat."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Chat transferido com sucesso.",
    data: result.data,
  });
}
