"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  fullName: z.string().trim().max(80),
  emailNotifications: z.boolean(),
});

export async function updateProfile(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false as const };
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName || null, email_notifications: parsed.data.emailNotifications })
    .eq("id", data.claims.sub);
  if (error) return { ok: false as const };
  revalidatePath("/", "layout");
  return { ok: true as const };
}
