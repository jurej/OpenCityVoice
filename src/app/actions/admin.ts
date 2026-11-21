"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(60),
  center_lat: z.number().min(-90).max(90),
  center_lng: z.number().min(-180).max(180),
  boundary: z.unknown().optional(),
  adminEmail: z.email().or(z.literal("")).optional(),
});

export async function createMunicipality(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) return { ok: false as const, error: "forbidden" };
  const { boundary, adminEmail, ...values } = parsed.data;

  const { data: municipality, error } = await supabase.from("municipalities").insert(values).select("id, slug").single();
  if (error || !municipality) return { ok: false as const, error: error?.code === "23505" ? "slugTaken" : "failed" };

  if (boundary) {
    await supabase.rpc("set_municipality_boundary", { p_municipality_id: municipality.id, p_geojson: boundary as never });
  }
  if (adminEmail) {
    const { data: userId } = await createAdminClient().rpc("user_id_by_email", { p_email: adminEmail });
    if (userId) {
      await supabase
        .from("municipality_members")
        .insert({ municipality_id: municipality.id, user_id: userId as string, role: "admin", status: "approved" });
    }
  }
  revalidatePath("/", "layout");
  return { ok: true as const, slug: municipality.slug };
}

export async function setMunicipalityActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("municipalities").update({ is_active: active }).eq("id", id);
  revalidatePath("/", "layout");
  return { ok: !error };
}

/** Marks a municipality as running this deployment itself, which hides the "independent initiative" notice. */
export async function setMunicipalityOfficial(id: string, official: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("municipalities").update({ is_official: official }).eq("id", id);
  revalidatePath("/", "layout");
  return { ok: !error };
}
