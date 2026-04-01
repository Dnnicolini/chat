import { NextResponse } from "next/server";
import { authorizedRequest, getErrorMessage } from "@/lib/helpdesk";

export async function PUT(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        type?: unknown;
        gender?: unknown;
        birth_date?: unknown;
        cpf_cnpj?: unknown;
        zip_code?: unknown;
        address?: unknown;
        district?: unknown;
        number?: unknown;
        city_name?: unknown;
        state_code?: unknown;
        country_code?: unknown;
        type_contact?: unknown;
        contact?: unknown;
      }
    | null;

  const body = {
    name:
      typeof payload?.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : undefined,
    type:
      typeof payload?.type === "string" && payload.type.trim()
        ? payload.type.trim()
        : undefined,
    gender:
      typeof payload?.gender === "string" && payload.gender.trim()
        ? payload.gender.trim()
        : undefined,
    birth_date:
      typeof payload?.birth_date === "string" && payload.birth_date.trim()
        ? payload.birth_date.trim()
        : undefined,
    cpf_cnpj:
      typeof payload?.cpf_cnpj === "string" && payload.cpf_cnpj.trim()
        ? payload.cpf_cnpj.trim()
        : undefined,
    zip_code:
      typeof payload?.zip_code === "string" && payload.zip_code.trim()
        ? payload.zip_code.trim()
        : undefined,
    address:
      typeof payload?.address === "string" && payload.address.trim()
        ? payload.address.trim()
        : undefined,
    district:
      typeof payload?.district === "string" && payload.district.trim()
        ? payload.district.trim()
        : undefined,
    number:
      typeof payload?.number === "string" && payload.number.trim()
        ? payload.number.trim()
        : undefined,
    city_name:
      typeof payload?.city_name === "string" && payload.city_name.trim()
        ? payload.city_name.trim()
        : undefined,
    state_code:
      typeof payload?.state_code === "string" && payload.state_code.trim()
        ? payload.state_code.trim()
        : undefined,
    country_code:
      typeof payload?.country_code === "string" && payload.country_code.trim()
        ? payload.country_code.trim()
        : undefined,
    type_contact:
      typeof payload?.type_contact === "string" && payload.type_contact.trim()
        ? payload.type_contact.trim()
        : undefined,
    contact:
      typeof payload?.contact === "string" && payload.contact.trim()
        ? payload.contact.trim()
        : undefined,
  };

  if (Object.values(body).every((value) => value === undefined)) {
    return NextResponse.json(
      {
        message: "Informe pelo menos um campo para completar o cadastro.",
      },
      { status: 400 },
    );
  }

  const result = await authorizedRequest("/auth/register/complete", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: getErrorMessage(result.data, "Falha ao completar o cadastro."),
        details: result.data,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: "Cadastro completado com sucesso.",
    data: result.data,
  });
}
