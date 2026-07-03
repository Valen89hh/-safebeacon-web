"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";

type Zone = { lat: number; lng: number; weight: number };

export default function MapaPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [totalAlertas, setTotalAlertas] = useState<number | null>(null);
  const [totalZonas, setTotalZonas] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.heat");
      if (cancelled || !mapRef.current) return;

      map = L.map(mapRef.current, { zoomControl: true }).setView(
        [-8.1116, -79.0287], // Trujillo por defecto
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Datos anónimos: densidad agregada por celda (función pública)
      const supabase = createClient();
      const { data, error } = await supabase.rpc("heatmap_zones", {
        grid_deg: 0.003,
      });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        return;
      }

      const zones = (data ?? []) as Zone[];
      setTotalZonas(zones.length);
      setTotalAlertas(zones.reduce((acc, z) => acc + Number(z.weight), 0));

      if (zones.length > 0) {
        const max = Math.max(...zones.map((z) => Number(z.weight)));
        const points = zones.map(
          (z) => [z.lat, z.lng, Number(z.weight)] as [number, number, number]
        );

        // @ts-expect-error heatLayer lo agrega el plugin leaflet.heat
        L.heatLayer(points, {
          radius: 30,
          blur: 22,
          max,
          minOpacity: 0.35,
          gradient: {
            0.2: "#22d3ee",
            0.4: "#facc15",
            0.7: "#f97316",
            1.0: "#ef4444",
          },
        }).addTo(map);

        const bounds = L.latLngBounds(
          zones.map((z) => [z.lat, z.lng] as [number, number])
        );
        map.fitBounds(bounds.pad(0.3));
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, []);

  return (
    <main className="relative h-screen w-screen">
      {/* Mapa */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Panel flotante */}
      <div className="absolute left-4 top-4 z-[1000] w-[min(92vw,340px)] rounded-2xl border border-neutral-800 bg-neutral-950/90 p-5 backdrop-blur">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 text-sm font-bold"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-red text-sm">
            🚨
          </span>
          SafeBeacon
        </Link>

        <h1 className="text-lg font-semibold">Mapa de zonas de riesgo</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Densidad de alertas agregada por zona. Datos{" "}
          <b>anónimos</b>: no se muestra ninguna persona ni alerta individual.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : (
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <p className="text-2xl font-bold">
                {totalAlertas ?? "—"}
              </p>
              <p className="text-xs text-neutral-500">alertas</p>
            </div>
            <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <p className="text-2xl font-bold">{totalZonas ?? "—"}</p>
              <p className="text-xs text-neutral-500">zonas</p>
            </div>
          </div>
        )}

        {totalZonas === 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            Aún no hay alertas registradas. En cuanto se dispare alguna, aparecerá
            aquí.
          </p>
        )}

        {/* Leyenda */}
        <div className="mt-4">
          <p className="mb-1 text-xs text-neutral-500">Intensidad</p>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#22d3ee] via-[#facc15] to-[#ef4444]" />
          <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
            <span>menos</span>
            <span>más</span>
          </div>
        </div>
      </div>
    </main>
  );
}
