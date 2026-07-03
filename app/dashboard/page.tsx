import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addContact, createDevice, deleteContact, signOut } from "./actions";

type Contact = {
  id: string;
  name: string;
  phone: string;
  relation: string | null;
};

type Device = {
  device_id: string;
  device_key: string;
  name: string | null;
};

type DeliveryEntry = {
  phone: string;
  ok: boolean;
  status?: string; // acuse WhatsApp: enviado | entregado | leído
  error?: string;
};

type Alert = {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  battery_pct: number | null;
  delivery: DeliveryEntry[] | null;
};

/** Fecha/hora legible en zona horaria de Lima. */
function fmtLima(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("id, name, phone, relation")
    .order("created_at", { ascending: true });

  const { data: devices } = await supabase
    .from("devices")
    .select("device_id, device_key, name")
    .order("created_at", { ascending: true });

  const { data: waSession } = await supabase
    .from("whatsapp_sessions")
    .select("status, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, created_at, lat, lng, battery_pct, delivery")
    .order("created_at", { ascending: false })
    .limit(5);

  const list = (contacts ?? []) as Contact[];
  const alertList = (alerts ?? []) as Alert[];
  const device = (devices ?? [])[0] as Device | undefined;
  const displayName = profile?.full_name || user.email;

  const waConnected = waSession?.status === "connected";

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-base">
            🚨
          </span>
          <span className="text-lg font-bold">SafeBeacon</span>
        </div>
        <form action={signOut}>
          <button className="btn-ghost" type="submit">
            Cerrar sesión
          </button>
        </form>
      </header>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Hola, {displayName} 👋</h1>
        <p className="text-neutral-400">
          Gestiona los contactos que recibirán tus alertas de emergencia.
        </p>
      </div>

      {/* Estado de conexión WhatsApp */}
      <section className="card mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Conexión WhatsApp</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {waConnected ? (
              <>
                <span className="text-green-400">● Conectado</span>
                {waSession?.phone ? ` · ${waSession.phone}` : ""}
              </>
            ) : (
              <span className="text-neutral-400">
                ● Sin vincular — las alertas se enviarán desde tu WhatsApp.
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/whatsapp" className="btn-primary shrink-0">
          {waConnected ? "Gestionar" : "Vincular WhatsApp"}
        </Link>
      </section>

      {/* Mi dispositivo */}
      <section className="card mb-6">
        <h2 className="mb-4 text-lg font-semibold">Mi dispositivo</h2>
        {device ? (
          <div className="space-y-3 text-sm">
            <p className="text-neutral-400">
              Copia estos valores en <code>include/config.h</code> del firmware.
            </p>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-neutral-500">DEVICE_ID</span>
                <span className="text-neutral-100">{device.device_id}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-neutral-500">API_KEY (device_key)</span>
                <span className="break-all text-neutral-100">
                  {device.device_key}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              El ESP32 envía <code>x-api-key: {"{device_key}"}</code> y{" "}
              <code>device_id</code> en el cuerpo.
            </p>
          </div>
        ) : (
          <form action={createDevice}>
            <p className="mb-3 text-sm text-neutral-400">
              Aún no tienes un dispositivo vinculado a tu cuenta.
            </p>
            <button className="btn-primary" type="submit">
              Generar dispositivo
            </button>
          </form>
        )}
      </section>

      {/* Agregar contacto */}
      <section className="card mb-6">
        <h2 className="mb-4 text-lg font-semibold">Agregar contacto</h2>
        <form action={addContact} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            className="input sm:flex-1"
            name="name"
            placeholder="Nombre"
            required
          />
          <input
            className="input sm:flex-1"
            name="phone"
            placeholder="WhatsApp (ej. 51987654321)"
            required
          />
          <input
            className="input sm:flex-1"
            name="relation"
            placeholder="Relación (ej. Mamá)"
          />
          <button className="btn-primary" type="submit">
            Agregar
          </button>
        </form>
        <p className="mt-3 text-xs text-neutral-500">
          Usa el número con código de país y sin símbolos. Ej: Perú → 51 + número.
        </p>
      </section>

      {/* Lista de contactos */}
      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">
          Contactos de emergencia{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({list.length})
          </span>
        </h2>

        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            Aún no tienes contactos. Agrega al menos uno para recibir alertas.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-800">
            {list.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-neutral-400">
                    {c.phone}
                    {c.relation ? ` · ${c.relation}` : ""}
                  </p>
                </div>
                <form action={deleteContact}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 transition hover:bg-brand-red/10 hover:text-red-400"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Mis últimas alertas */}
      <section className="card mt-6">
        <h2 className="mb-4 text-lg font-semibold">
          Mis últimas alertas{" "}
          <span className="text-sm font-normal text-neutral-500">
            ({alertList.length})
          </span>
        </h2>

        {alertList.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            Aún no has disparado ninguna alerta. Al presionar el botón aparecerá
            aquí, con el estado de entrega a cada contacto.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-800">
            {alertList.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{fmtLima(a.created_at)}</p>
                  <a
                    href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-red hover:underline"
                  >
                    📍 Ver ubicación
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.delivery === null ? (
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                      Sin enviar · WhatsApp no estaba conectado
                    </span>
                  ) : (
                    a.delivery.map((d, i) => {
                      const leido = d.status === "leído" || d.status === "reproducido";
                      const entregado = d.status === "entregado";
                      const cls = !d.ok
                        ? "bg-brand-red/10 text-red-400"
                        : leido
                          ? "bg-sky-500/10 text-sky-400"
                          : entregado
                            ? "bg-green-500/10 text-green-400"
                            : "bg-neutral-800 text-neutral-300";
                      const icon = !d.ok
                        ? "✕"
                        : leido
                          ? "👁"
                          : entregado
                            ? "✓✓"
                            : "✓";
                      const label = !d.ok
                        ? d.error ?? "falló"
                        : (d.status ?? "enviado");
                      return (
                        <span
                          key={i}
                          className={`rounded-full px-2 py-0.5 text-xs ${cls}`}
                          title={d.phone}
                        >
                          {icon} {d.phone} · {label}
                        </span>
                      );
                    })
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
