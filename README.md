# SafeBeacon — Web App

Panel web de SafeBeacon (proyecto académico TECSUP). Permite a cada usuario **registrarse, iniciar sesión y gestionar sus contactos de emergencia** — las personas que recibirán la alerta por WhatsApp cuando se active el botón de pánico.

Construido con **Next.js (App Router)** + **Supabase** (Auth + Postgres con RLS) + **Tailwind CSS**.

## Stack

- Next.js 14 (App Router, Server Actions)
- Supabase Auth (email/password) vía `@supabase/ssr`
- Tailwind CSS
- Deploy: Vercel

## Setup local

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Edita .env.local con la URL y anon key de tu proyecto Supabase
npm run dev
```

Abre <http://localhost:3000>.

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (anon key) del proyecto. |

> ⚠️ **Confirmación de email:** por defecto Supabase exige confirmar el correo antes de iniciar sesión. Para pruebas, desactívalo en **Supabase → Authentication → Sign In / Providers → Email → "Confirm email" (off)**. Si lo dejas activo, tras registrarte revisa tu correo y confirma antes de entrar.

## Estructura

```
app/
├── page.tsx              landing (redirige a /dashboard si hay sesión)
├── login/page.tsx        login + registro
└── dashboard/
    ├── page.tsx          panel protegido: contactos de emergencia
    └── actions.ts        server actions (agregar/eliminar contacto, logout)
lib/supabase/
├── client.ts            cliente para el navegador
├── server.ts            cliente para Server Components / Actions
└── middleware.ts        refresco de sesión + protección de rutas
middleware.ts            entrada del middleware
```

## Seguridad

La autorización vive en la base de datos: todas las tablas tienen **RLS** y las políticas garantizan que cada usuario solo lee/escribe **sus** contactos (`user_id = auth.uid()`). La app nunca expone datos de otros usuarios.

## Deploy a Vercel

1. Sube el repo a GitHub e impórtalo en [Vercel](https://vercel.com).
2. Agrega las env vars `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. En Supabase → Authentication → URL Configuration, agrega la URL de Vercel a **Site URL** y **Redirect URLs**.
4. Deploy.

_Proyecto académico — SafeBeacon · TECSUP._
