import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Next solo inlinea `process.env.NEXT_PUBLIC_X` con acceso literal: no usar lookups dinámicos.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url)
    throw new Error("Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL");
  if (!key)
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );

  return createBrowserClient(url, key);
}
