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
        name?: unknown;
        email?: unknown;
        username?: unknown;
        contact?: unknown;
        password?: unknown;
        password_confirmation?: unknown;
        type?: unknown;
        gender?: unknown;
        birth_date?: unknown;
        zip_code?: unknown;
        address?: unknown;
        district?: unknown;
        number?: unknown;
        city_name?: unknown;
        state_code?: unknown;
        country_code?: unknown;
        type_contact?: unknown;
      }
    | null;

  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const username =
    typeof payload?.username === "string" ? payload.username.trim() : "";
  const contact =
    typeof payload?.contact === "string" ? payload.contact.trim() : "";
  const password =
    typeof payload?.password === "string" ? payload.password : "";
  const passwordConfirmation =
    typeof payload?.password_confirmation === "string"
      ? payload.password_confirmation
      : "";
  const type = typeof payload?.type === "string" ? payload.type.trim() : "";
  const gender =
    typeof payload?.gender === "string" ? payload.gender.trim() : "";
  const birthDate =
    typeof payload?.birth_date === "string" ? payload.birth_date.trim() : "";
  const zipCode =
    typeof payload?.zip_code === "string" ? payload.zip_code.trim() : "";
  const address =
    typeof payload?.address === "string" ? payload.address.trim() : "";
  const district =
    typeof payload?.district === "string" ? payload.district.trim() : "";
  const number =
    typeof payload?.number === "string" ? payload.number.trim() : "";
  const cityName =
    typeof payload?.city_name === "string" ? payload.city_name.trim() : "";
  const stateCode =
    typeof payload?.state_code === "string" ? payload.state_code.trim() : "";
  const countryCode =
    typeof payload?.country_code === "string"
      ? payload.country_code.trim()
      : "";
  const typeContact =
    typeof payload?.type_contact === "string"
      ? payload.type_contact.trim()
      : "";

  if (
    !name ||
    !email ||
    !username ||
    !contact ||
    !password ||
    !passwordConfirmation ||
    !typeContact
  ) {
    return NextResponse.json(
      {
        message:
          "Informe name, email, username, contact, password, password_confirmation e type_contact.",
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

  const register = await backendRequest("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      username,
      password,
      password_confirmation: passwordConfirmation,
      name,
      type: type || "individual",
      gender: gender || "male",
      birth_date: birthDate || undefined,
      zip_code: zipCode || undefined,
      address: address || undefined,
      district: district || undefined,
      number: number || undefined,
      city_name: cityName || undefined,
      state_code: stateCode || undefined,
      country_code: countryCode || "BR",
      type_contact: typeContact,
      contact,
    }),
  });

  if (!register.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(register.data, "Falha ao cadastrar usuario."),
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
    message: "Cadastro realizado com sucesso.",
    user: me?.ok ? me.data : null,
    auth: register.data,
  });

  applyTokenCookies(response, register.data);
  return response;
}
