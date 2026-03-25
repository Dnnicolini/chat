import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function GET() {
  const result = await authorizedRequest("/auth/me");

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao consultar o usuario."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Usuario carregado com sucesso.",
    data: result.data,
  });
}
