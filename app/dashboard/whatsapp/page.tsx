"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/NavBar";

const ALERT_URL = process.env.NEXT_PUBLIC_ALERT_SERVICE_URL!;

type Status =
  | "loading"
  | "waiting_qr"
  | "connected"
  | "disconnected"
  | "logged_out";

export default function WhatsAppPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }
    try {
      const res = await fetch(`${ALERT_URL}/api/session/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error || "Error al iniciar");
      setStatus(d.status);
      setQr(d.qr ?? null);
    } catch (e) {
      setError(
        e instanceof Error
          ? `No se pudo contactar el alert-service (${e.message}). ¿Está corriendo?`
          : "Error desconocido"
      );
    }
  }, [getToken]);

  // Polling de estado
  useEffect(() => {
    let active = true;
    start();
    const id = setInterval(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${ALERT_URL}/api/session/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (active && d.ok) {
          setStatus(d.status);
          setQr(d.qr ?? null);
        }
      } catch {
        /* el polling reintenta */
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [start, getToken]);

  async function logout() {
    const token = await getToken();
    if (!token) return;
    await fetch(`${ALERT_URL}/api/session/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setStatus("disconnected");
    setQr(null);
    start();
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold">Vincular WhatsApp</h1>
      <p className="mb-6 text-neutral-400">
        Tus alertas se enviarán desde tu propio WhatsApp a tus contactos de
        emergencia.
      </p>

      <div className="mb-6 rounded-xl border border-amber-600/40 bg-amber-600/10 px-4 py-3 text-sm text-amber-200">
        ⚠️ Usa un número de WhatsApp <b>dedicado</b>, no tu cuenta personal —
        existe riesgo de bloqueo por parte de WhatsApp.
      </div>

      <div className="card flex flex-col items-center gap-4 text-center">
        {error && (
          <p className="w-full rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {status === "connected" ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 text-3xl">
              ✅
            </div>
            <p className="text-lg font-semibold text-green-400">
              WhatsApp conectado
            </p>
            <p className="text-sm text-neutral-400">
              Tu dispositivo ya puede enviar alertas.
            </p>
            <button onClick={logout} className="btn-ghost mt-2">
              Desvincular
            </button>
          </>
        ) : qr ? (
          <>
            <p className="text-sm text-neutral-300">
              Abre WhatsApp → <b>Dispositivos vinculados</b> →{" "}
              <b>Vincular dispositivo</b> y escanea:
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="Código QR de WhatsApp"
              className="h-64 w-64 rounded-lg bg-white p-2"
            />
            <p className="text-xs text-neutral-500">
              El estado se actualiza solo al escanear…
            </p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-red" />
            <p className="text-sm text-neutral-400">
              {status === "loading"
                ? "Generando código QR…"
                : "Esperando código QR…"}
            </p>
          </>
        )}
      </div>
      </main>
    </>
  );
}
