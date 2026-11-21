"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createMunicipality, setMunicipalityActive, setMunicipalityOfficial } from "@/app/actions/admin";

type Row = { id: string; slug: string; name: string; isActive: boolean; isOfficial: boolean; color: string; hasBoundary: boolean; reports: number; open: number };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/^(mestna\s+)?obcina\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminView({ municipalities }: { municipalities: Row[] }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [looking, setLooking] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", center_lat: 0, center_lng: 0, adminEmail: "" });
  const [boundary, setBoundary] = useState<unknown>(null);

  async function lookup() {
    if (!query.trim()) return;
    setLooking(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&polygon_threshold=0.0005&limit=1&q=${encodeURIComponent(query)}`,
      );
      const [hit] = await res.json();
      if (!hit) throw new Error("not found");
      const name = hit.name || hit.display_name.split(",")[0];
      setForm((f) => ({ ...f, name, slug: slugify(name), center_lat: Number(hit.lat), center_lng: Number(hit.lon) }));
      setBoundary(["Polygon", "MultiPolygon"].includes(hit.geojson?.type) ? hit.geojson : null);
    } catch {
      toast.error(tc("error"));
    }
    setLooking(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createMunicipality({ ...form, boundary: boundary ?? undefined });
      if (!result.ok) return void toast.error(result.error === "slugTaken" ? t("slugTaken") : tc("error"));
      toast.success(t("created"));
      router.push(`/${result.slug}/manage/settings`);
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-4 py-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <section>
        <h2 className="font-semibold">{t("municipalities")}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{t("municipalities")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("reports")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("open")}</th>
                <th className="px-3 py-2 font-medium">{t("boundary")}</th>
                <th className="px-3 py-2 font-medium">{t("active")}</th>
                <th className="px-3 py-2 font-medium">{t("official")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {municipalities.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2.5">
                    <Link href={`/${m.slug}/manage`} className="flex items-center gap-2 font-medium hover:underline">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                      {m.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">/{m.slug}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{m.reports}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{m.open}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{m.hasBoundary ? t("yes") : t("no")}</td>
                  <td className="px-3 py-2.5">
                    <Switch
                      checked={m.isActive}
                      onCheckedChange={(value) => startTransition(async () => { await setMunicipalityActive(m.id, value); router.refresh(); })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Switch
                      checked={m.isOfficial}
                      onCheckedChange={(value) => startTransition(async () => { await setMunicipalityOfficial(m.id, value); router.refresh(); })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border p-4 sm:p-5">
        <h2 className="font-semibold">{t("newMunicipality")}</h2>
        <div className="mt-4 space-y-2">
          <Label htmlFor="lookup">{t("lookup")}</Label>
          <div className="flex gap-2">
            <Input id="lookup" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("lookupPlaceholder")} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookup())} />
            <Button variant="outline" onClick={lookup} disabled={looking}>
              {looking ? <Loader2 className="animate-spin" /> : <Search />}
              {tc("search")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("lookupText")}</p>
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="a-name">{t("municipalities")}</Label>
            <Input id="a-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-slug">{t("slug")}</Label>
            <Input id="a-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Lat / Lng</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" step="any" required value={form.center_lat} onChange={(e) => setForm({ ...form, center_lat: Number(e.target.value) })} aria-label="Latitude" />
              <Input type="number" step="any" required value={form.center_lng} onChange={(e) => setForm({ ...form, center_lng: Number(e.target.value) })} aria-label="Longitude" />
            </div>
            <p className="text-xs text-muted-foreground">{t("boundary")}: {boundary ? t("yes") : t("no")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-admin">{t("adminEmail")}</Label>
            <Input id="a-admin" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
            <p className="text-xs text-muted-foreground">{t("adminEmailText")}</p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {t("create")}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
