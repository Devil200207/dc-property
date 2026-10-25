"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, FileText, ImagePlus, Loader2, Star, Trash2, Upload, X } from "lucide-react";
import type { Listing } from "@/lib/db";
import { AREA_UNITS, DISTRICTS, FACINGS, PROPERTY_TYPES, STATUSES, TEHSILS } from "@/lib/constants";
import { formatPrice, mediaUrl, thumbUrl } from "@/lib/format";
import type { LatLng } from "@/lib/geo";
import { landRecordLinks } from "@/lib/site";
import { LocationPicker } from "@/components/map/LocationPicker";
import { saveListing } from "../../actions";

/* ---------- upload helpers ---------- */

/** Shrink phone photos in the browser before upload — 6 MB → ~400 KB, so uploads are fast even on 4G. */
async function compress(file: File, max: number): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 400_000) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // e.g. HEIC on some browsers — let the server try
  }
}

function upload(blob: Blob, purpose: "photo" | "map", onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", blob, blob instanceof File ? blob.name : "upload.jpg");
    fd.append("purpose", purpose);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { key?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 200 && body.key) resolve(body.key);
      else reject(new Error(body.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection"));
    xhr.send(fd);
  });
}

type Photo = { id: string; key?: string; preview: string; progress: number; error?: string };

/* ---------- form ---------- */

export function ListingForm({ listing, villages }: { listing?: Listing; villages: string[] }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [v, setV] = useState({
    title: listing?.title ?? "",
    type: listing?.type ?? "residential",
    status: listing?.status ?? "available",
    featured: listing?.featured ?? false,
    description: listing?.description ?? "",
    khasra_no: listing?.khasra_no ?? "",
    khatauni_no: listing?.khatauni_no ?? "",
    village: listing?.village ?? "",
    tehsil: listing?.tehsil ?? "",
    district: listing?.district ?? "Mathura",
    landmark: listing?.landmark ?? "",
    price: listing?.price ? String(listing.price) : "",
    price_basis: listing?.price_basis ?? "total",
    negotiable: listing?.negotiable ?? false,
    area: listing?.area ? String(listing.area) : "",
    area_unit: listing?.area_unit ?? "sqyd",
    road_width: listing?.road_width ?? "",
    facing: listing?.facing ?? "",
  });
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));
  const bind = (k: keyof typeof v) => ({
    value: v[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value as never),
  });

  const [point, setPoint] = useState<LatLng | null>(listing?.lat && listing?.lng ? [listing.lat, listing.lng] : null);
  const [boundary, setBoundary] = useState<LatLng[]>(listing?.boundary ?? []);

  const [photos, setPhotos] = useState<Photo[]>(
    (listing?.photos ?? []).map((key) => ({ id: key, key, preview: thumbUrl(key), progress: 100 })),
  );
  const [map, setMap] = useState<{ key?: string; name: string; progress: number; error?: string } | null>(
    listing?.khasra_map ? { key: listing.khasra_map, name: "Current khasra map", progress: 100 } : null,
  );
  const [dragOver, setDragOver] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const patchPhoto = (id: string, patch: Partial<Photo>) => setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function addPhotos(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const items = list.map((f) => ({ file: f, photo: { id: crypto.randomUUID(), preview: URL.createObjectURL(f), progress: 0 } as Photo }));
    setPhotos((ps) => [...ps, ...items.map((i) => i.photo)]);
    // Upload 3 at a time.
    const queue = [...items];
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        for (let item; (item = queue.shift()); ) {
          const { file, photo } = item;
          try {
            const blob = await compress(file, 2000);
            const key = await upload(blob, "photo", (progress) => patchPhoto(photo.id, { progress }));
            patchPhoto(photo.id, { key, progress: 100 });
          } catch (e) {
            patchPhoto(photo.id, { error: e instanceof Error ? e.message : "Upload failed" });
          }
        }
      }),
    );
  }

  async function addMap(file: File) {
    setMap({ name: file.name, progress: 0 });
    try {
      const blob = file.type === "application/pdf" ? file : await compress(file, 3000);
      const key = await upload(blob, "map", (progress) => setMap((m) => m && { ...m, progress }));
      setMap({ key, name: file.name, progress: 100 });
    } catch (e) {
      setMap({ name: file.name, progress: 0, error: e instanceof Error ? e.message : "Upload failed" });
    }
  }

  const move = (i: number, d: number) =>
    setPhotos((ps) => {
      const j = i + d;
      if (j < 0 || j >= ps.length) return ps;
      const next = [...ps];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const uploading = photos.some((p) => !p.key && !p.error) || (map && !map.key && !map.error);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSave(async () => {
      const res = await saveListing(listing?.id ?? null, {
        ...v,
        lat: point?.[0] ?? null,
        lng: point?.[1] ?? null,
        boundary,
        photos: photos.filter((p) => p.key).map((p) => p.key),
        khasra_map: map?.key ?? null,
      }).catch(() => ({ error: "Could not save — you may need to log in again." }));
      if ("error" in res && res.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  const priceNum = Number(v.price.replace(/,/g, ""));
  const unitShort = AREA_UNITS[v.area_unit as keyof typeof AREA_UNITS]?.short ?? v.area_unit;

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl pb-28">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All listings
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{listing ? "Edit listing" : "New listing"}</h1>

      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <datalist id="villages">{villages.map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="tehsils">{TEHSILS.map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="districts">{DISTRICTS.map((x) => <option key={x} value={x} />)}</datalist>

      <div className="space-y-6">
        <Section title="Land record" hint="Khasra number and village are required.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Khasra No. *">
              <input {...bind("khasra_no")} required placeholder="e.g. 245 / 245मि / 312, 313" className="input" />
            </Field>
            <Field label="Khatauni / Khata No.">
              <input {...bind("khatauni_no")} placeholder="Optional" className="input" />
            </Field>
            <Field label="Village / Locality *">
              <input {...bind("village")} required list="villages" placeholder="e.g. Chhatikara" className="input" />
            </Field>
            <Field label="Tehsil">
              <input {...bind("tehsil")} list="tehsils" placeholder="e.g. Mathura" className="input" />
            </Field>
            <Field label="District">
              <input {...bind("district")} list="districts" className="input" />
            </Field>
            <Field label="Landmark / Nearby">
              <input {...bind("landmark")} placeholder="e.g. 500 m from Vrindavan–Chhatikara Road" className="input" />
            </Field>
          </div>
        </Section>

        <Section title="Price & size">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)" hint={priceNum > 0 ? `= ${formatPrice(priceNum)}${v.price_basis === "per_unit" ? ` per ${unitShort}` : ""}` : "Leave empty for “Price on request”"}>
              <div className="flex gap-2">
                <input {...bind("price")} inputMode="numeric" placeholder="e.g. 4500000" className="input" />
                <select {...bind("price_basis")} className="input w-36 shrink-0">
                  <option value="total">Total</option>
                  <option value="per_unit">Per {unitShort}</option>
                </select>
              </div>
            </Field>
            <Field label="Area">
              <div className="flex gap-2">
                <input {...bind("area")} inputMode="decimal" placeholder="e.g. 200" className="input" />
                <select {...bind("area_unit")} className="input w-36 shrink-0">
                  {Object.entries(AREA_UNITS).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Road width">
              <input {...bind("road_width")} placeholder="e.g. 30 ft" className="input" />
            </Field>
            <Field label="Facing">
              <select {...bind("facing")} className="input">
                <option value="">—</option>
                {FACINGS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </Field>
          </div>
          <Toggle checked={v.negotiable} onChange={(c) => set("negotiable", c)} label="Price is negotiable" />
        </Section>

        <Section title="Photos" hint="First photo is the cover. Photos are compressed automatically.">
          <div
            onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => (e.preventDefault(), setDragOver(false), addPhotos(e.dataTransfer.files))}
            className={`grid grid-cols-2 gap-3 rounded-xl sm:grid-cols-4 ${dragOver ? "ring-4 ring-brand-500/20" : ""}`}
          >
            {photos.map((p, i) => (
              <div key={p.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className={`size-full object-cover ${p.key ? "" : "opacity-60"}`} />
                {i === 0 && p.key && <span className="chip absolute left-2 top-2 bg-amber-400 text-amber-950"><Star className="size-3" /> Cover</span>}
                {!p.key && !p.error && (
                  <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-white/60">
                    <div className="h-full bg-brand-600 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                )}
                {p.error && <p className="absolute inset-x-0 bottom-0 bg-red-600/90 p-1.5 text-[11px] leading-tight text-white">{p.error}</p>}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  {i > 0 && p.key && (
                    <IconBtn title="Make cover" onClick={() => setPhotos((ps) => [ps[i], ...ps.filter((_, j) => j !== i)])}><Star className="size-3.5" /></IconBtn>
                  )}
                  <IconBtn title="Remove" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}><X className="size-3.5" /></IconBtn>
                </div>
                {p.key && photos.length > 1 && (
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    {i > 0 && <IconBtn title="Move left" onClick={() => move(i, -1)}><ArrowLeft className="size-3.5" /></IconBtn>}
                    {i < photos.length - 1 && <IconBtn title="Move right" onClick={() => move(i, 1)}><ArrowRight className="size-3.5" /></IconBtn>}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700"
            >
              <ImagePlus className="size-6" />
              Add photos
              <span className="text-xs font-normal text-slate-400">or drag &amp; drop</span>
            </button>
          </div>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => (e.target.files && addPhotos(e.target.files), (e.target.value = ""))}
          />
        </Section>

        <Section
          title="Khasra map"
          hint={
            <>
              Download the plot map from{" "}
              <a href={landRecordLinks.bhunaksha} target="_blank" rel="noopener" className="font-medium text-brand-600 underline">UP Bhu-Naksha</a>{" "}
              (PDF or screenshot) and upload it here.
            </>
          }
        >
          {map ? (
            <div className="flex items-center gap-4 rounded-xl border border-line p-3">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                {map.key && !map.key.endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl(map.key)} alt="" className="size-full object-cover" />
                ) : (
                  <FileText className="size-7 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{map.name}</p>
                {map.error ? (
                  <p className="text-xs text-red-600">{map.error}</p>
                ) : map.key ? (
                  <a href={mediaUrl(map.key)} target="_blank" rel="noopener" className="text-xs text-brand-600 hover:underline">Open</a>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-muted"><Loader2 className="size-3 animate-spin" /> Uploading {map.progress}%</p>
                )}
              </div>
              <button type="button" onClick={() => setMap(null)} className="btn-ghost size-9 p-0 text-red-600" title="Remove"><Trash2 className="size-4" /></button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 p-8 text-sm font-medium text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700">
              <Upload className="size-6" />
              Upload khasra map
              <span className="text-xs font-normal text-slate-400">PDF, JPG or PNG</span>
              <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && addMap(e.target.files[0])} />
            </label>
          )}
        </Section>

        <Section title="Location on map" hint="Paste the Google Maps link of the plot, tap “I'm here” when standing on it, or tap the satellite map. Then mark the plot corners with Boundary.">
          <LocationPicker
            point={point}
            boundary={boundary}
            onPoint={setPoint}
            onBoundary={setBoundary}
            onUseArea={(sqyd) => setV((s) => ({ ...s, area: String(sqyd), area_unit: "sqyd" }))}
          />
        </Section>

        <Section title="Listing details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Property type">
              <select {...bind("type")} className="input">
                {Object.entries(PROPERTY_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select {...bind("status")} className="input">
                {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Title" hint="Leave empty to auto-generate, e.g. “200 gaj Residential Plot in Chhatikara”" className="sm:col-span-2">
              <input {...bind("title")} placeholder="Auto-generated if empty" className="input" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea {...bind("description")} rows={5} placeholder="Road access, electricity, water, nearby temples / colonies, registry status…" className="input" />
            </Field>
          </div>
          <Toggle checked={v.featured} onChange={(c) => set("featured", c)} label="Feature this listing at the top of the site" />
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[1000] border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-xs text-muted">{uploading ? "Waiting for uploads to finish…" : v.status === "draft" ? "Draft — not visible on the site" : "Will be visible on the site after saving"}</p>
          <div className="flex gap-2">
            <Link href="/admin" className="btn-ghost">Cancel</Link>
            <button disabled={saving || !!uploading} className="btn-primary min-w-32">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {listing ? "Save changes" : "Publish listing"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ---------- small UI pieces ---------- */

function Section({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (c: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick} className="grid size-7 place-items-center rounded-lg bg-white/95 text-ink shadow hover:bg-white">
      {children}
    </button>
  );
}
