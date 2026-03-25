import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

type RouteParams = {
  params: Promise<{ clientId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { clientId } = await params;

  if (!clientId.trim()) {
    return NextResponse.json(
      {
        message: "Informe o clientId.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest(
    `/client/${encodeURIComponent(clientId)}`,
    {
      method: "DELETE",
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao remover o cliente."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Cliente removido com sucesso.",
    data: result.data,
  });
}
