import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-red text-4xl shadow-[0_0_40px_rgba(225,29,42,0.45)]">
          🚨
        </div>
        <h1 className="text-4xl font-bold tracking-tight">SafeBeacon</h1>
        <p className="max-w-md text-neutral-400">
          Botón de pánico con geolocalización. Cuando lo necesites, tus contactos
          de emergencia reciben tu ubicación al instante por WhatsApp.
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/login" className="btn-primary">
          Iniciar sesión
        </Link>
        <Link href="/login?mode=signup" className="btn-ghost">
          Crear cuenta
        </Link>
      </div>

      <Link
        href="/mapa"
        className="text-sm text-neutral-400 underline-offset-4 hover:text-neutral-200 hover:underline"
      >
        Ver mapa de zonas de riesgo →
      </Link>

      <p className="text-xs text-neutral-600">Proyecto académico · TECSUP</p>
    </main>
  );
}
