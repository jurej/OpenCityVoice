"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error?: string };

const localizedName = z.record(z.string(), z.string().trim().max(80)).refine((v) => Object.values(v).some(Boolean));
const color = z.string().regex(/^#[0-9a-f]{6}$/i);

async function adminClient(municipalityId: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_municipality_admin", { mid: municipalityId });
  if (!isAdmin) return null;
  const { data } = await supabase.from("municipalities").select("slug").eq("id", municipalityId).single();
  return data ? { supabase, slug: data.slug } : null;
}

function done(slug: string): Result {
  revalidatePath(`/${slug}`, "layout");
  return { ok: true };
}

const municipalitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  contact_email: z.email().or(z.literal("")).optional(),
  website_url: z.url().or(z.literal("")).optional(),
  primary_color: color,
  center_lat: z.number().min(-90).max(90),
  center_lng: z.number().min(-180).max(180),
  default_zoom: z.number().min(3).max(19),
});

export async function updateMunicipality(municipalityId: string, input: z.input<typeof municipalitySchema>): Promise<Result> {
  const parsed = municipalitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ctx = await adminClient(municipalityId);
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("municipalities")
    .update({ ...parsed.data, contact_email: parsed.data.contact_email || null, website_url: parsed.data.website_url || null })
    .eq("id", municipalityId);
  return error ? { ok: false } : done(ctx.slug);
}

export async function setBoundary(municipalityId: string, geojson: unknown | null): Promise<Result> {
  const ctx = await adminClient(municipalityId);
  if (!ctx) return { ok: false };
  if (geojson === null) {
    const { error } = await ctx.supabase.from("municipalities").update({ boundary: null }).eq("id", municipalityId);
    return error ? { ok: false } : done(ctx.slug);
  }
  const geometry = extractPolygon(geojson);
  if (!geometry) return { ok: false, error: "invalidGeojson" };
  const { error } = await ctx.supabase.rpc("set_municipality_boundary", {
    p_municipality_id: municipalityId,
    p_geojson: geometry as never,
  });
  return error ? { ok: false, error: "invalidGeojson" } : done(ctx.slug);
}

/** Accepts a Geometry, Feature or FeatureCollection and returns the first (Multi)Polygon geometry. */
function extractPolygon(input: unknown): object | null {
  if (!input || typeof input !== "object") return null;
  const value = input as { type?: string; geometry?: unknown; features?: unknown[] };
  if (value.type === "Polygon" || value.type === "MultiPolygon") return value;
  if (value.type === "Feature") return extractPolygon(value.geometry);
  if (value.type === "FeatureCollection" && Array.isArray(value.features)) {
    for (const feature of value.features) {
      const found = extractPolygon(feature);
      if (found) return found;
    }
  }
  return null;
}

const categorySchema = z.object({
  id: z.uuid().optional(),
  name: localizedName,
  icon: z.string().max(40),
  color,
  is_active: z.boolean(),
  default_assignee_id: z.uuid().nullable(),
});

export async function saveCategory(municipalityId: string, input: z.input<typeof categorySchema>): Promise<Result> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ctx = await adminClient(municipalityId);
  if (!ctx) return { ok: false };
  const { id, ...values } = parsed.data;
  if (id) {
    const { error } = await ctx.supabase.from("categories").update(values).eq("id", id).eq("municipality_id", municipalityId);
    return error ? { ok: false } : done(ctx.slug);
  }
  const { data: last } = await ctx.supabase
    .from("categories")
    .select("sort_order")
    .eq("municipality_id", municipalityId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await ctx.supabase
    .from("categories")
    .insert({ ...values, municipality_id: municipalityId, sort_order: (last?.sort_order ?? 0) + 10 });
  return error ? { ok: false } : done(ctx.slug);
}

const statusSchema = z.object({
  id: z.uuid().optional(),
  name: localizedName,
  color,
  is_active: z.boolean(),
  is_initial: z.boolean(),
  is_closed: z.boolean(),
});

export async function saveStatus(municipalityId: string, input: z.input<typeof statusSchema>): Promise<Result> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ctx = await adminClient(municipalityId);
  if (!ctx) return { ok: false };
  const { id, ...values } = parsed.data;
  // Exactly one initial status per municipality.
  if (values.is_initial) {
    values.is_active = true;
    await ctx.supabase.from("statuses").update({ is_initial: false }).eq("municipality_id", municipalityId).neq("id", id ?? "");
  }
  if (id) {
    const { error } = await ctx.supabase.from("statuses").update(values).eq("id", id).eq("municipality_id", municipalityId);
    return error ? { ok: false } : done(ctx.slug);
  }
  const { data: last } = await ctx.supabase
    .from("statuses")
    .select("sort_order")
    .eq("municipality_id", municipalityId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await ctx.supabase
    .from("statuses")
    .insert({ ...values, municipality_id: municipalityId, sort_order: (last?.sort_order ?? 0) + 10 });
  return error ? { ok: false } : done(ctx.slug);
}

export async function moveItem(
  municipalityId: string,
  table: "categories" | "statuses",
  id: string,
  direction: -1 | 1,
): Promise<Result> {
  const ctx = await adminClient(municipalityId);
  if (!ctx) return { ok: false };
  const { data: items } = await ctx.supabase
    .from(table)
    .select("id, sort_order")
    .eq("municipality_id", municipalityId)
    .order("sort_order");
  if (!items) return { ok: false };
  const index = items.findIndex((i) => i.id === id);
  const swap = items[index + direction];
  if (index < 0 || !swap) return { ok: true };
  const current = items[index]!;
  await ctx.supabase.from(table).update({ sort_order: swap.sort_order }).eq("id", current.id);
  await ctx.supabase.from(table).update({ sort_order: current.sort_order }).eq("id", swap.id);
  return done(ctx.slug);
}

export async function deleteItem(municipalityId: string, table: "categories" | "statuses", id: string): Promise<Result> {
  const ctx = await adminClient(municipalityId);
  if (!ctx) return { ok: false };
  const column = table === "categories" ? "category_id" : "status_id";
  const { count } = await ctx.supabase.from("reports").select("id", { count: "exact", head: true }).eq(column, id);
  if (count) return { ok: false, error: "inUse" };
  const { error } = await ctx.supabase.from(table).delete().eq("id", id).eq("municipality_id", municipalityId);
  return error ? { ok: false } : done(ctx.slug);
}
