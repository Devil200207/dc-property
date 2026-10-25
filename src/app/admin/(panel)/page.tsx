import Link from "next/link";
import { Eye, MapPin, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listAll } from "@/lib/db";
import { formatArea, priceLine, thumbUrl, timeAgo } from "@/lib/format";
import { RowActions } from "./RowActions";

export default async function Dashboard() {
  await requireAdmin();
  const listings = await listAll();
  const count = (s: string) => listings.filter((l) => l.status === s).length;
  const stats = [
    ["Total listings", listings.length],
    ["Available", count("available")],
    ["Booked", count("booked")],
    ["Sold", count("sold")],
    ["Total views", listings.reduce((a, l) => a + l.views, 0)],
  ] as const;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="text-sm text-muted">Add a plot, upload photos &amp; khasra map — it goes live instantly.</p>
        </div>
        <Link href="/admin/listings/new" className="btn-primary"><Plus className="size-4" /> New listing</Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="card grid place-items-center px-6 py-20 text-center">
          <MapPin className="size-10 text-slate-300" />
          <p className="mt-4 font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted">Create your first listing to show it on the website.</p>
          <Link href="/admin/listings/new" className="btn-primary mt-5"><Plus className="size-4" /> New listing</Link>
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <Link href={`/admin/listings/${l.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {l.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbUrl(l.photos[0])} alt="" className="size-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{l.title}</p>
                  <p className="truncate text-sm text-muted">
                    Khasra {l.khasra_no} · {l.village} · {formatArea(l.area, l.area_unit)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">{priceLine(l)}</span>
                    <span className="flex items-center gap-1"><Eye className="size-3" /> {l.views}</span>
                    <span>Updated {timeAgo(l.updated_at).toLowerCase()}</span>
                  </p>
                </div>
              </Link>
              <RowActions id={l.id} status={l.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
