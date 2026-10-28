import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente nuevo por petición: nunca compartir uno en un módulo global.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url)
    throw new Error("Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL");
  if (!key)
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Desde un Server Component no se pueden escribir cookies; sin autenticación no hace falta.
        }
      },
    },
  });
}
