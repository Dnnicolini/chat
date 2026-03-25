import { NextResponse } from "next/server";
import { clearTokenCookies, clearTokens } from "@/lib/helpdesk";

export async function POST() {
  await clearTokens();

  const response = NextResponse.json({
    message: "Sessao encerrada.",
  });

  clearTokenCookies(response);
  return response;
}
