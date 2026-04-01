import { NextResponse } from "next/server";
import {
  applyTokenCookies,
  backendRequest,
  getErrorMessage,
  persistTokens,
  readTokenPayload,
} from "@/lib/helpdesk";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        email?: unknown;
        password?: unknown;
        password_confirmation?: unknown;
        name?: unknown;
        birth_date?: unknown;
        contact?: unknown;
      }
    | null;

  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const password =
    typeof payload?.password === "string" ? payload.password : "";
  const passwordConfirmation =
    typeof payload?.password_confirmation === "string"
      ? payload.password_confirmation
      : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const birthDate =
    typeof payload?.birth_date === "string" ? payload.birth_date.trim() : "";
  const contact =
    typeof payload?.contact === "string" ? payload.contact.trim() : "";

  if (!email || !password || !passwordConfirmation || !name || !contact) {
    return NextResponse.json(
      {
        message:
          "Informe email, password, password_confirmation, name e contact.",
      },
      { status: 400 },
    );
  }

  if (password !== passwordConfirmation) {
    return NextResponse.json(
      {
        message: "password e password_confirmation precisam ser iguais.",
      },
      { status: 400 },
    );
  }

  const register = await backendRequest("/auth/register/basic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      password_confirmation: passwordConfirmation,
      name,
      birth_date: birthDate || undefined,
      contact,
    }),
  });

  if (!register.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(register.data, "Falha ao criar o cadastro basico."),
        details: register.data,
      },
      { status: register.status },
    );
  }

  await persistTokens(register.data);
  const tokens = readTokenPayload(register.data);
  const me = tokens.accessToken
    ? await backendRequest("/auth/me", { method: "GET" }, tokens.accessToken)
    : null;

  const response = NextResponse.json({
    message: "Cadastro basico realizado com sucesso.",
    user: me?.ok ? me.data : null,
    auth: register.data,
  });

  applyTokenCookies(response, register.data);
  return response;
}
