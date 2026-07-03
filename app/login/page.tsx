"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        // Si la confirmación de email está activa, no hay sesión todavía.
        if (!data.session) {
          setInfo(
            "Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión."
          );
          setMode("login");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-lg font-bold"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-base">
            🚨
          </span>
          SafeBeacon
        </Link>

        <div className="card">
          <h1 className="mb-1 text-xl font-semibold">
            {mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
          <p className="mb-6 text-sm text-neutral-400">
            {mode === "signup"
              ? "Regístrate para configurar tu botón de pánico."
              : "Entra para gestionar tus contactos de emergencia."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                className="input"
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && (
              <p className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-300">
                {info}
              </p>
            )}

            <button type="submit" className="btn-primary mt-1" disabled={loading}>
              {loading
                ? "Procesando…"
                : mode === "signup"
                ? "Crear cuenta"
                : "Entrar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-400">
            {mode === "signup" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <button
              type="button"
              className="font-medium text-brand-red hover:underline"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "signup" ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
