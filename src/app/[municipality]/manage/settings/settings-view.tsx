"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { isMapStyleId, mapStyleIds } from "@/components/map/map-styles";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryIcon, categoryIcons } from "@/components/category-icon";
import { StatusBadge } from "@/components/report-bits";
import { deleteItem, moveItem, saveCategory, saveStatus, setBoundary, setLogo, updateMunicipality } from "@/app/actions/settings";
import { MunicipalityLogo } from "@/components/municipality-logo";
import { createClient } from "@/lib/supabase/client";
import { LOGO_BUCKET } from "@/lib/config";
import { localeNames, locales, localized } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/lib/data";
import type { Category, PublicMunicipality, Status } from "@/lib/types";

type Props = {
  municipality: PublicMunicipality;
  categories: Category[];
  statuses: Status[];
  members: StaffMember[];
  boundary: GeoJSON.Geometry | null;
};

type Result = { ok: boolean; error?: string };

function useAction() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<Result>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(tc("saved"));
        onSuccess?.();
        router.refresh();
      } else if (result.error === "inUse" || result.error === "invalidGeojson") toast.error(t(result.error));
      else toast.error(tc("error"));
    });
  }
  return { pending, run };
}

export function SettingsView({ municipality, categories, statuses, members, boundary }: Props) {
  const t = useTranslations("settings");
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <MunicipalityForm municipality={municipality} hasBoundary={Boolean(boundary)} />
        <ItemList kind="categories" municipalityId={municipality.id} items={categories} members={members} />
        <ItemList kind="statuses" municipalityId={municipality.id} items={statuses} members={members} />
      </div>
    </div>
  );
}

const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function LogoForm({ municipality }: { municipality: PublicMunicipality }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { pending, run } = useAction();
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    const ext = LOGO_TYPES[file.type];
    if (!ext) return toast.error(tc("error"));
    if (file.size > 1024 * 1024) return toast.error(t("logoTooLarge"));
    setUploading(true);
    const path = `${municipality.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from(LOGO_BUCKET).upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return toast.error(tc("error"));
    run(() => setLogo(municipality.id, path));
  }

  return (
    <div className="mt-6 border-t pt-5">
      <h3 className="text-sm font-semibold">{t("logo")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("logoText")}</p>
      <div className="mt-4 flex items-center gap-3">
        <MunicipalityLogo name={municipality.name} logoPath={municipality.logo_path} color={municipality.primary_color} className="size-14 rounded-lg border text-lg" />
        <input ref={input} type="file" accept={Object.keys(LOGO_TYPES).join(",")} className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        <Button type="button" variant="outline" disabled={pending || uploading} onClick={() => input.current?.click()}>
          {municipality.logo_path ? t("replaceLogo") : t("uploadLogo")}
        </Button>
        {municipality.logo_path && (
          <Button type="button" variant="ghost" disabled={pending || uploading} onClick={() => run(() => setLogo(municipality.id, null))}>
            {t("removeLogo")}
          </Button>
        )}
      </div>
    </div>
  );
}

function MunicipalityForm({ municipality, hasBoundary }: { municipality: PublicMunicipality; hasBoundary: boolean }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tm = useTranslations("map");
  const { pending, run } = useAction();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: municipality.name,
    contact_email: municipality.contact_email ?? "",
    website_url: municipality.website_url ?? "",
    primary_color: municipality.primary_color,
    center_lat: municipality.center_lat,
    center_lng: municipality.center_lng,
    default_zoom: municipality.default_zoom,
    default_map_style: isMapStyleId(municipality.default_map_style) ? municipality.default_map_style : ("map" as const),
  });

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      run(() => setBoundary(municipality.id, json));
    } catch {
      toast.error(t("invalidGeojson"));
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <section className="rounded-xl border p-4 sm:p-5">
      <h2 className="font-semibold">{t("municipality")}</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateMunicipality(municipality.id, form));
        }}
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="m-name">{t("name")}</Label>
          <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-email">{t("contactEmail")}</Label>
          <Input id="m-email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-web">{t("website")}</Label>
          <Input id="m-web" type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-color">{t("color")}</Label>
          <div className="flex gap-2">
            <input id="m-color" type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border bg-background p-1" />
            <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="font-mono" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("mapCenter")}</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" step="0.0001" value={form.center_lat} onChange={(e) => setForm({ ...form, center_lat: Number(e.target.value) })} aria-label="Latitude" />
            <Input type="number" step="0.0001" value={form.center_lng} onChange={(e) => setForm({ ...form, center_lng: Number(e.target.value) })} aria-label="Longitude" />
            <Input type="number" step="0.5" min={3} max={19} value={form.default_zoom} onChange={(e) => setForm({ ...form, default_zoom: Number(e.target.value) })} aria-label="Zoom" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-map-style">{t("defaultMapStyle")}</Label>
          <NativeSelect
            id="m-map-style"
            value={form.default_map_style}
            onChange={(e) => setForm({ ...form, default_map_style: e.target.value as typeof form.default_map_style })}
          >
            {mapStyleIds.map((id) => (
              <option key={id} value={id}>
                {tm(id)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>{tc("save")}</Button>
        </div>
      </form>
      <LogoForm municipality={municipality} />
      <div className="mt-6 border-t pt-5">
        <h3 className="text-sm font-semibold">{t("boundary")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("boundaryText")}</p>
        <input ref={fileInput} type="file" accept=".geojson,.json,application/geo+json,application/json" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={pending}>{t("uploadBoundary")}</Button>
          {hasBoundary && (
            <Button variant="ghost" className="text-muted-foreground" onClick={() => run(() => setBoundary(municipality.id, null))} disabled={pending}>
              {t("removeBoundary")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

type Item = Category | Status;

function ItemList({ kind, municipalityId, items, members }: { kind: "categories" | "statuses"; municipalityId: string; items: Item[]; members: StaffMember[] }) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const { pending, run } = useAction();
  const [editing, setEditing] = useState<Item | "new" | null>(null);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold">{t(kind)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(`${kind}Text`)}</p>
        </div>
        <Button variant="outline" onClick={() => setEditing("new")} className="shrink-0">
          <Plus />
          {kind === "categories" ? t("newCategory") : t("newStatus")}
        </Button>
      </div>
      <ul className="mt-4 divide-y rounded-xl border">
        {items.map((item, i) => (
          <li key={item.id} className={cn("flex items-center gap-3 px-3 py-2.5", !item.is_active && "opacity-55")}>
            {"icon" in item ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: item.color }}>
                <CategoryIcon name={item.icon} className="size-4 text-white" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              {"icon" in item ? (
                <p className="truncate text-sm font-medium">{localized(item.name, locale)}</p>
              ) : (
                <StatusBadge name={item.name} color={item.color} />
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[
                  !item.is_active && t("inactive"),
                  "is_initial" in item && item.is_initial && t("initial"),
                  "is_closed" in item && item.is_closed && t("closed"),
                  "default_assignee_id" in item && item.default_assignee_id && members.find((m) => m.id === item.default_assignee_id)?.name,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0">
              <Button variant="ghost" size="icon" disabled={pending || i === 0} onClick={() => run(() => moveItem(municipalityId, kind, item.id, -1))} aria-label={t("moveUp")}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon" disabled={pending || i === items.length - 1} onClick={() => run(() => moveItem(municipalityId, kind, item.id, 1))} aria-label={t("moveDown")}>
                <ArrowDown />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setEditing(item)} aria-label="Edit">
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={pending} onClick={() => run(() => deleteItem(municipalityId, kind, item.id))} aria-label="Delete">
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {editing && (
        <ItemDialog
          kind={kind}
          municipalityId={municipalityId}
          item={editing === "new" ? null : editing}
          members={members}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function ItemDialog({ kind, municipalityId, item, members, onClose }: { kind: "categories" | "statuses"; municipalityId: string; item: Item | null; members: StaffMember[]; onClose: () => void }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { pending, run } = useAction();
  const initialName = (item?.name ?? {}) as Record<string, string>;
  const [name, setName] = useState<Record<string, string>>(Object.fromEntries(locales.map((l) => [l, initialName[l] ?? ""])));
  const [color, setColor] = useState(item?.color ?? "#64748b");
  const [active, setActive] = useState(item?.is_active ?? true);
  const [icon, setIcon] = useState(item && "icon" in item ? item.icon : "circle-alert");
  const [assignee, setAssignee] = useState(item && "default_assignee_id" in item ? item.default_assignee_id ?? "" : "");
  const [initial, setInitial] = useState(item && "is_initial" in item ? item.is_initial : false);
  const [closed, setClosed] = useState(item && "is_closed" in item ? item.is_closed : false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const base = { id: item?.id, name, color, is_active: active };
    run(
      () =>
        kind === "categories"
          ? saveCategory(municipalityId, { ...base, icon, default_assignee_id: assignee || null })
          : saveStatus(municipalityId, { ...base, is_initial: initial, is_closed: closed }),
      onClose,
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? tc("edit") : kind === "categories" ? t("newCategory") : t("newStatus")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {locales.map((l) => (
            <div key={l} className="space-y-2">
              <Label htmlFor={`name-${l}`}>{t("nameIn", { locale: localeNames[l] })}</Label>
              <Input id={`name-${l}`} value={name[l]} onChange={(e) => setName({ ...name, [l]: e.target.value })} maxLength={80} required={l === locales[0]} />
            </div>
          ))}
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-color">{t("color")}</Label>
              <input id="item-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border bg-background p-1" />
            </div>
            {kind === "categories" && (
              <div className="min-w-0 flex-1 space-y-2">
                <Label>{t("defaultAssignee")}</Label>
                <NativeSelect value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">{tc("none")}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name ?? m.id.slice(0, 8)}</option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
          {kind === "categories" && (
            <div className="space-y-2">
              <Label>{t("icon")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(categoryIcons).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-label={key}
                    aria-pressed={icon === key}
                    className={cn("flex size-9 items-center justify-center rounded-lg border", icon === key ? "border-transparent text-white" : "hover:bg-muted")}
                    style={icon === key ? { backgroundColor: color } : undefined}
                  >
                    <CategoryIcon name={key} className="size-4" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3 rounded-lg border p-3">
            <label className="flex items-center justify-between text-sm">
              {t("active")}
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
            {kind === "statuses" && (
              <>
                <label className="flex items-center justify-between text-sm">
                  {t("initial")}
                  <Switch checked={initial} onCheckedChange={setInitial} disabled={Boolean(item && "is_initial" in item && item.is_initial)} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  {t("closed")}
                  <Switch checked={closed} onCheckedChange={setClosed} />
                </label>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>{tc("cancel")}</Button>
            <Button type="submit" disabled={pending}>{tc("save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
