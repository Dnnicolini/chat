import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        email?: unknown;
        phone?: unknown;
        password?: unknown;
      }
    | null;

  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const phone = typeof payload?.phone === "string" ? payload.phone.trim() : "";
  const password =
    typeof payload?.password === "string" ? payload.password : "";

  if (!name || !email || !phone || !password) {
    return NextResponse.json(
      {
        message: "Preencha todos os campos obrigatorios para continuar.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      code: "BACKEND_SIGNUP_UNAVAILABLE",
      message:
        "A colecao atual da Helpdesk API nao expoe uma rota publica de cadastro. O acesso real continua sendo feito por POST /auth/login com credenciais provisionadas no backend.",
    },
    { status: 501 },
  );
}
