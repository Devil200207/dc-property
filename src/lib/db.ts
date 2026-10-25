import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { connection } from "next/server";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

import type { LatLng } from "./geo";
export type { LatLng };

export type Listing = {
  id: number;
  title: string;
  type: string;
  status: string;
  price: number | null;
  price_basis: "total" | "per_unit";
  negotiable: boolean;
  area: number | null;
  area_unit: string;
  khasra_no: string;
  khatauni_no: string | null;
  village: string;
  tehsil: string | null;
  district: string;
  landmark: string | null;
  road_width: string | null;
  facing: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  boundary: LatLng[];
  khasra_map: string | null;
  photos: string[];
  featured: boolean;
  views: number;
  created_at: string;
  updated_at: string;
};

export type ListingInput = Omit<Listing, "id" | "views" | "created_at" | "updated_at">;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS listings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  type         TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'available',
  price        INTEGER,
  price_basis  TEXT    NOT NULL DEFAULT 'total',
  negotiable   INTEGER NOT NULL DEFAULT 0,
  area         REAL,
  area_unit    TEXT    NOT NULL DEFAULT 'sqyd',
  khasra_no    TEXT    NOT NULL,
  khatauni_no  TEXT,
  village      TEXT    NOT NULL,
  tehsil       TEXT,
  district     TEXT    NOT NULL DEFAULT 'Mathura',
  landmark     TEXT,
  road_width   TEXT,
  facing       TEXT,
  description  TEXT,
  lat          REAL,
  lng          REAL,
  boundary     TEXT    NOT NULL DEFAULT '[]',
  khasra_map   TEXT,
  photos       TEXT    NOT NULL DEFAULT '[]',
  featured     INTEGER NOT NULL DEFAULT 0,
  views        INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_khasra ON listings(khasra_no);
`;

function open() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "dc.sqlite"));
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(SCHEMA);
  return db;
}

const g = globalThis as unknown as { __dcdb?: Database.Database };
const db = (g.__dcdb ??= open());

type Row = Omit<Listing, "boundary" | "photos" | "negotiable" | "featured"> & {
  boundary: string;
  photos: string;
  negotiable: number;
  featured: number;
};

const toListing = (r: Row): Listing => ({
  ...r,
  boundary: JSON.parse(r.boundary || "[]"),
  photos: JSON.parse(r.photos || "[]"),
  negotiable: !!r.negotiable,
  featured: !!r.featured,
});

const TOTAL_PRICE = "(CASE WHEN price_basis = 'per_unit' THEN price * COALESCE(area, 0) ELSE price END)";

export type Filters = {
  q?: string;
  type?: string;
  tehsil?: string;
  budget?: string; // max total price in rupees
  sort?: string;
};

export async function listPublic(f: Filters = {}): Promise<Listing[]> {
  await connection();
  const where = ["status != 'draft'"];
  const args: Record<string, unknown> = {};
  if (f.q?.trim()) {
    where.push(
      "(title LIKE @q OR village LIKE @q OR khasra_no LIKE @q OR landmark LIKE @q OR tehsil LIKE @q OR district LIKE @q)",
    );
    args.q = `%${f.q.trim()}%`;
  }
  if (f.type) (where.push("type = @type"), (args.type = f.type));
  if (f.tehsil) (where.push("tehsil = @tehsil"), (args.tehsil = f.tehsil));
  const budget = Number(f.budget);
  if (budget > 0) (where.push(`${TOTAL_PRICE} <= @budget`), (args.budget = budget));

  const order =
    f.sort === "price_asc"
      ? `${TOTAL_PRICE} IS NULL, ${TOTAL_PRICE} ASC`
      : f.sort === "price_desc"
        ? `${TOTAL_PRICE} DESC`
        : "featured DESC, created_at DESC";

  const rows = db
    .prepare(`SELECT * FROM listings WHERE ${where.join(" AND ")} ORDER BY (status = 'sold'), ${order}, id DESC`)
    .all(args) as Row[];
  return rows.map(toListing);
}

export async function listAll(): Promise<Listing[]> {
  await connection();
  return (db.prepare("SELECT * FROM listings ORDER BY updated_at DESC, id DESC").all() as Row[]).map(toListing);
}

export async function getListing(id: number): Promise<Listing | null> {
  await connection();
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id) as Row | undefined;
  return row ? toListing(row) : null;
}

export function countViews(id: number) {
  db.prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(id);
}

export async function filterOptions() {
  await connection();
  const tehsils = db
    .prepare("SELECT DISTINCT tehsil FROM listings WHERE status != 'draft' AND tehsil IS NOT NULL AND tehsil != '' ORDER BY tehsil")
    .pluck()
    .all() as string[];
  const villages = db.prepare("SELECT DISTINCT village FROM listings ORDER BY village").pluck().all() as string[];
  return { tehsils, villages };
}

const COLUMNS = [
  "title", "type", "status", "price", "price_basis", "negotiable", "area", "area_unit", "khasra_no",
  "khatauni_no", "village", "tehsil", "district", "landmark", "road_width", "facing", "description",
  "lat", "lng", "boundary", "khasra_map", "photos", "featured",
] as const;

function toParams(input: ListingInput) {
  return {
    ...input,
    negotiable: input.negotiable ? 1 : 0,
    featured: input.featured ? 1 : 0,
    boundary: JSON.stringify(input.boundary ?? []),
    photos: JSON.stringify(input.photos ?? []),
  };
}

export function createListing(input: ListingInput): number {
  const sql = `INSERT INTO listings (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map((c) => "@" + c).join(", ")})`;
  return Number(db.prepare(sql).run(toParams(input)).lastInsertRowid);
}

export function updateListing(id: number, input: ListingInput) {
  const sql = `UPDATE listings SET ${COLUMNS.map((c) => `${c} = @${c}`).join(", ")}, updated_at = datetime('now') WHERE id = @id`;
  db.prepare(sql).run({ ...toParams(input), id });
}

export function setStatus(id: number, status: string) {
  db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export function deleteListing(id: number) {
  db.prepare("DELETE FROM listings WHERE id = ?").run(id);
}

/** Read without connection() — for mutations that already run at request time. */
export function getListingSync(id: number): Listing | null {
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id) as Row | undefined;
  return row ? toListing(row) : null;
}
