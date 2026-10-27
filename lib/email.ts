import { Resend } from "resend";

export type ContactMessage = { name: string; email: string; msg: string };

const DEFAULT_FROM = "onboarding@resend.dev";

/** Envía un mensaje de contacto. Lanza si falta configuración o Resend falla. */
export async function sendContactEmail({ name, email, msg }: ContactMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    throw new Error("Falta RESEND_API_KEY o CONTACT_TO_EMAIL");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
    to,
    replyTo: email,
    subject: `Contacto Arcade Vault: ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
  });
  if (error) {
    throw new Error(`Resend: ${error.name} - ${error.message}`);
  }
}
