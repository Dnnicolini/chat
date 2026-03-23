import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/helpdesk";

export async function POST() {
  await clearTokens();

  return NextResponse.json({
    message: "Sessao encerrada.",
  });
}
