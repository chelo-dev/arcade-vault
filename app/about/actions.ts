"use server";

import { sendContactEmail } from "@/lib/email";

export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string }
  | { status: "error"; message: string };

const MAX_NAME = 60;
const MAX_EMAIL = 254;
const MAX_MSG = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = field(formData, "name");

  // Honeypot: un humano no ve este campo. Responder éxito para no delatar el filtro.
  if (field(formData, "website")) return { status: "ok", name };

  const email = field(formData, "email");
  const msg = field(formData, "msg");

  if (!name || !email || !msg) {
    return { status: "error", message: "COMPLETA TODOS LOS CAMPOS." };
  }
  if (name.length > MAX_NAME) {
    return { status: "error", message: `EL NOMBRE NO PUEDE SUPERAR ${MAX_NAME} CARACTERES.` };
  }
  if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { status: "error", message: "INTRODUCE UN CORREO ELECTRÓNICO VÁLIDO." };
  }
  if (msg.length > MAX_MSG) {
    return { status: "error", message: `EL MENSAJE NO PUEDE SUPERAR ${MAX_MSG} CARACTERES.` };
  }

  try {
    await sendContactEmail({ name, email, msg });
  } catch (err) {
    console.error("[contact] fallo al enviar el correo:", err);
    return {
      status: "error",
      message: "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO MÁS TARDE.",
    };
  }

  return { status: "ok", name };
}
