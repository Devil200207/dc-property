import Link from "next/link";
import { LayoutGrid, Map as MapIcon, SearchX, ShieldCheck, Satellite, FileText } from "lucide-react";
import { filterOptions, listPublic } from "@/lib/db";
import { priceLine, thumbUrl } from "@/lib/format";
import { TEHSILS } from "@/lib/constants";
import { ListingCard } from "@/components/ListingCard";
import { FilterBar } from "@/components/FilterBar";
import ListingsMap, { type MapItem } from "@/components/map/ListingsMap";

type SP = { q?: string; type?: string; tehsil?: string; budget?: string; sort?: string; view?: string };

const SORTS = [
  ["", "Newest"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
];

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [listings, { tehsils }] = await Promise.all([listPublic(sp), filterOptions()]);
  const isMap = sp.view === "map";
  const filtered = !!(sp.q || sp.type || sp.tehsil || sp.budget);

  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  const mapItems: MapItem[] = listings
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      id: l.id,
      title: l.title,
      lat: l.lat!,
      lng: l.lng!,
      price: priceLine(l),
      place: [l.village, l.tehsil].filter(Boolean).join(", "),
      thumb: l.photos[0] ? thumbUrl(l.photos[0]) : null,
      sold: l.status === "sold",
    }));

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 pb-24 pt-14 text-white sm:pt-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div aria-hidden className="absolute -right-40 -top-40 size-[520px] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="container-page relative">
          <p className="chip mb-5 bg-white/10 text-white/90 ring-1 ring-white/15">Mathura · Vrindavan · Govardhan · Barsana</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Find the right plot in Braj, with khasra, map &amp; photos in one place.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
            Every listing shows its khasra number, the official land map and the exact location on satellite view, so you
            know precisely what you are buying.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            <span className="flex items-center gap-2"><FileText className="size-4 text-brand-200" /> Khasra & khatauni details</span>
            <span className="flex items-center gap-2"><Satellite className="size-4 text-brand-200" /> Satellite location & boundary</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-200" /> Verify on UP Bhulekh</span>
          </div>
        </div>
      </section>

      <div className="container-page relative -mt-10">
        <FilterBar values={sp} tehsils={[...new Set([...TEHSILS, ...tehsils])]} />
      </div>

      <section className="container-page mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{filtered ? "Search results" : "Available properties"}</h2>
            <p className="text-sm text-muted">
              {listings.length} {listings.length === 1 ? "property" : "properties"}
              {filtered && (
                <>
                  {" · "}
                  <Link href={isMap ? "/?view=map" : "/"} className="font-medium text-brand-600 hover:underline">Clear filters</Link>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isMap && (
              <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
                {SORTS.map(([v, label]) => (
                  <Link
                    key={v}
                    href={qs({ sort: v })}
                    className={`hidden rounded-lg px-3 py-1.5 font-medium md:block ${(sp.sort ?? "") === v ? "bg-slate-100 text-ink" : "text-muted hover:text-ink"}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
            <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
              <Link href={qs({ view: "" })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium ${!isMap ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
                <LayoutGrid className="size-4" /> Grid
              </Link>
              <Link href={qs({ view: "map" })} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium ${isMap ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
                <MapIcon className="size-4" /> Map
              </Link>
            </div>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="card grid place-items-center px-6 py-20 text-center">
            <SearchX className="size-10 text-slate-300" />
            <p className="mt-4 font-semibold">No properties match your search</p>
            <p className="mt-1 text-sm text-muted">Try a different village or budget — or call us, new plots come in every week.</p>
          </div>
        ) : isMap ? (
          <div className="card h-[70vh] min-h-[420px] overflow-hidden">
            <ListingsMap items={mapItems} />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l, i) => (
              <ListingCard key={l.id} l={l} priority={i < 3} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
