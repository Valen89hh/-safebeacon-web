"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/dashboard/actions";

const links = [
  { href: "/dashboard", label: "Panel" },
  { href: "/mapa", label: "Mapa" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
];

/** Barra de navegación de las páginas autenticadas. */
export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-red text-sm">
            🚨
          </span>
          <span className="hidden text-base sm:inline">SafeBeacon</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((l) => {
            const active =
              l.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <form action={signOut} className="shrink-0">
          <button
            type="submit"
            className="rounded-lg px-2.5 py-1.5 text-sm text-neutral-500 transition hover:text-neutral-200"
          >
            Salir
          </button>
        </form>
      </nav>
    </header>
  );
}
