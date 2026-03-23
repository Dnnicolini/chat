import { NextResponse } from "next/server";
import { getSessionSnapshot } from "@/lib/helpdesk";

export async function GET() {
  return NextResponse.json(await getSessionSnapshot());
}
