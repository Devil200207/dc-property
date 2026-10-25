"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  assertAdmin, checkPassword, clearLoginAttempts, createSession, destroySession, loginRateLimited,
} from "@/lib/auth";
import {
  createListing, deleteListing, getListingSync, setStatus, updateListing, type ListingInput,
} from "@/lib/db";
import { AREA_UNITS, PROPERTY_TYPES, STATUSES } from "@/lib/constants";
import { formatArea } from "@/lib/format";
import { parseLatLng, type LatLng } from "@/lib/geo";
import { deleteUploads, KEY_RE } from "@/lib/uploads";

/* ---------- auth ---------- */

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (loginRateLimited(ip)) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!checkPassword(String(form.get("password") ?? ""))) return { error: "Incorrect password" };
  clearLoginAttempts(ip);
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- listings ---------- */

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const optStr = (v: unknown, max = 200) => str(v, max) || null;
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const oneOf = <T extends string>(v: unknown, options: Record<T, unknown>, fallback: T): T =>
  typeof v === "string" && v in options ? (v as T) : fallback;

function sanitize(raw: Record<string, unknown>): ListingInput | string {
  const khasra_no = str(raw.khasra_no, 100);
  const village = str(raw.village, 100);
  if (!khasra_no) return "Khasra number is required";
  if (!village) return "Village / locality is required";

  const type = oneOf(raw.type, PROPERTY_TYPES, "residential");
  const area = num(raw.area);
  const area_unit = oneOf(raw.area_unit, AREA_UNITS, "sqyd");

  let lat = num(raw.lat) && Number(raw.lat);
  let lng = num(raw.lng) && Number(raw.lng);
  if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) lat = lng = null;

  const boundary = (Array.isArray(raw.boundary) ? raw.boundary : [])
    .filter((p): p is LatLng => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number" && Number.isFinite(n)))
    .slice(0, 200);

  const photos = (Array.isArray(raw.photos) ? raw.photos : [])
    .filter((k): k is string => typeof k === "string" && KEY_RE.test(k) && k.endsWith(".webp") && !k.includes("-t."))
    .slice(0, 30);
  const khasra_map = typeof raw.khasra_map === "string" && KEY_RE.test(raw.khasra_map) ? raw.khasra_map : null;

  const typeLabel = PROPERTY_TYPES[type];
  const title = str(raw.title, 140) || [area ? formatArea(area, area_unit) : "", typeLabel, "in", village].filter(Boolean).join(" ");

  return {
    title,
    type,
    status: oneOf(raw.status, STATUSES, "available"),
    price: num(raw.price) && Math.round(num(raw.price)!),
    price_basis: raw.price_basis === "per_unit" ? "per_unit" : "total",
    negotiable: !!raw.negotiable,
    area,
    area_unit,
    khasra_no,
    khatauni_no: optStr(raw.khatauni_no, 100),
    village,
    tehsil: optStr(raw.tehsil, 100),
    district: str(raw.district, 100) || "Mathura",
    landmark: optStr(raw.landmark, 200),
    road_width: optStr(raw.road_width, 50),
    facing: optStr(raw.facing, 30),
    description: optStr(raw.description, 5000),
    lat,
    lng,
    boundary,
    khasra_map,
    photos,
    featured: !!raw.featured,
  };
}

export async function saveListing(id: number | null, raw: Record<string, unknown>) {
  await assertAdmin();
  const input = sanitize(raw);
  if (typeof input === "string") return { error: input };

  if (id) {
    const old = getListingSync(id);
    if (!old) return { error: "Listing not found" };
    updateListing(id, input);
    // Remove files that are no longer referenced.
    await deleteUploads([
      ...old.photos.filter((p) => !input.photos.includes(p)),
      old.khasra_map !== input.khasra_map ? old.khasra_map : null,
    ]);
  } else {
    id = createListing(input);
  }
  revalidatePath("/", "layout");
  return { id };
}

export async function deleteListingAction(id: number) {
  await assertAdmin();
  const old = getListingSync(id);
  if (!old) return;
  deleteListing(id);
  await deleteUploads([...old.photos, old.khasra_map]);
  revalidatePath("/", "layout");
}

export async function setStatusAction(id: number, status: string) {
  await assertAdmin();
  if (!(status in STATUSES)) return;
  setStatus(id, status);
  revalidatePath("/", "layout");
}

/* ---------- Google Maps link → coordinates ---------- */

const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "g.co", "maps.google.com", "www.google.com", "google.com", "www.google.co.in", "google.co.in"]);

/** Accepts anything Google Maps "Share" gives you, including maps.app.goo.gl short links. */
export async function resolveMapsLink(text: string): Promise<{ point?: LatLng; error?: string }> {
  await assertAdmin();
  const direct = parseLatLng(text);
  if (direct) return { point: direct };

  let url: URL;
  try {
    url = new URL(text.trim().match(/https?:\/\/\S+/)?.[0] ?? "");
  } catch {
    return { error: "Paste a Google Maps link or coordinates like 27.4924, 77.6737" };
  }
  for (let hop = 0; hop < 5; hop++) {
    if (!SHORT_LINK_HOSTS.has(url.hostname)) break;
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(6000) }).catch(() => null);
    const next = res?.headers.get("location");
    if (!next) break;
    url = new URL(next, url);
    const p = parseLatLng(url.toString());
    if (p) return { point: p };
  }
  return { error: "Couldn't read a location from that link. In Google Maps, long-press the plot and copy the coordinates instead." };
}
