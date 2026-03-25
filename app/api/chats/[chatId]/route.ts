import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

type RouteParams = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { chatId } = await params;

  if (!chatId.trim()) {
    return NextResponse.json(
      {
        message: "Informe o chatId.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(`/chats/${encodeURIComponent(chatId)}`);

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao carregar o chat."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Chat carregado com sucesso.",
    data: result.data,
  });
}
