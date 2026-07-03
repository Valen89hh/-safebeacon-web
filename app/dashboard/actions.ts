"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Normaliza un número a formato internacional solo-dígitos.
 * Ej: "+51 987-654-321" -> "51987654321".
 * Si es un móvil peruano de 9 dígitos (empieza con 9), le antepone el
 * código de país 51 automáticamente (evita el error de guardar "950146898"
 * sin código de país, que hace fallar el envío por WhatsApp).
 */
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // prefijo internacional 00
  if (digits.length === 9 && digits.startsWith("9")) digits = "51" + digits;
  return digits;
}

export async function addContact(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const relation = String(formData.get("relation") ?? "").trim() || null;

  if (!name || phone.length < 8) {
    return; // validación mínima; la UI ya marca required
  }

  // user_id se setea explícito; RLS exige que coincida con auth.uid()
  await supabase.from("emergency_contacts").insert({
    user_id: user.id,
    name,
    phone,
    relation,
  });

  revalidatePath("/dashboard");
}

export async function deleteContact(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // RLS asegura que solo pueda borrar contactos propios
  await supabase.from("emergency_contacts").delete().eq("id", id);

  revalidatePath("/dashboard");
}

export async function unlinkTelegram(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // RLS asegura que solo pueda editar contactos propios
  await supabase
    .from("emergency_contacts")
    .update({ telegram_chat_id: null })
    .eq("id", id);

  revalidatePath("/dashboard");
}

export async function createDevice() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // device_id legible y único; device_key lo genera la DB por defecto.
  const deviceId = "SB-" + crypto.randomUUID().slice(0, 8).toUpperCase();

  await supabase.from("devices").insert({
    user_id: user.id,
    device_id: deviceId,
    name: "Mi botón SafeBeacon",
  });

  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
