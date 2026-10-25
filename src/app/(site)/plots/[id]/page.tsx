import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  ArrowUpRight, ChevronRight, Compass, ExternalLink, FileText, Landmark, MapPin, Navigation, Phone, Route, Ruler, Tag,
} from "lucide-react";
import { countViews, getListing } from "@/lib/db";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/constants";
import { formatArea, formatPrice, placeLine, priceLine, thumbUrl, timeAgo, totalPrice } from "@/lib/format";
import { directionsUrl, googleMapsUrl } from "@/lib/geo";
import { landRecordLinks, site } from "@/lib/site";
import { Gallery } from "@/components/Gallery";
import { KhasraMapViewer } from "@/components/KhasraMapViewer";
import { CopyButton } from "@/components/CopyButton";
import { ShareButton } from "@/components/ShareButton";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import PlotMap from "@/components/map/PlotMap";

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const l = await getListing(Number((await params).id));
  if (!l || l.status === "draft") notFound();
  return l;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await load(params);
  const description = `${formatArea(l.area, l.area_unit)} ${PROPERTY_TYPES[l.type as PropertyType] ?? ""} in ${l.village}${l.tehsil ? `, ${l.tehsil}` : ""} — Khasra ${l.khasra_no}. ${priceLine(l)}.`;
  return {
    title: l.title,
    description,
    openGraph: { title: `${l.title} · ${priceLine(l)}`, description, images: l.photos[0] ? [thumbUrl(l.photos[0])] : [] },
  };
}

export default async function PlotPage({ params }: Props) {
  const l = await load(params);
  after(() => countViews(l.id));

  const url = `${site.url}/plots/${l.id}`;
  const place = placeLine(l.village, l.tehsil, l.district);
  const total = l.price_basis === "per_unit" ? totalPrice(l) : null;
  const waText = encodeURIComponent(`Hi, I'm interested in "${l.title}" (Khasra ${l.khasra_no}, ${l.village}). ${url}`);
  const waLink = site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${waText}` : null;
  const hasLocation = l.lat != null && l.lng != null;

  const facts = [
    { icon: Ruler, label: "Area", value: formatArea(l.area, l.area_unit) },
    { icon: FileText, label: "Khasra No.", value: l.khasra_no },
    { icon: Tag, label: "Type", value: PROPERTY_TYPES[l.type as PropertyType] ?? l.type },
    { icon: Route, label: "Road width", value: l.road_width },
    { icon: Compass, label: "Facing", value: l.facing },
    { icon: Landmark, label: "Khatauni No.", value: l.khatauni_no },
  ].filter((f) => f.value);

  const record = [
    ["Khasra No.", l.khasra_no],
    ["Khatauni No.", l.khatauni_no],
    ["Village", l.village],
    ["Tehsil", l.tehsil],
    ["District", l.district],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="container-page pt-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link href="/" className="hover:text-ink">Properties</Link>
        <ChevronRight className="size-4" />
        <span className="truncate text-ink">{l.village}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <StatusBadge status={l.status} />
            <span className="chip bg-brand-50 text-brand-700">{PROPERTY_TYPES[l.type as PropertyType] ?? l.type}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{l.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-muted">
            <MapPin className="size-4 shrink-0" /> {l.landmark ? `${l.landmark}, ` : ""}{place}
          </p>
        </div>
        <ShareButton title={l.title} url={url} />
      </div>

      <Gallery photos={l.photos} title={l.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          {/* Key facts */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <Icon className="size-3.5" /> {label}
                </p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </section>

          {l.description && (
            <section>
              <h2 className="mb-3 text-lg font-bold tracking-tight">About this property</h2>
              <p className="whitespace-pre-line leading-relaxed text-slate-700">{l.description}</p>
            </section>
          )}

          {/* Location */}
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Location</h2>
                <p className="text-sm text-muted">
                  {l.boundary.length >= 3 ? "Plot boundary is marked in yellow on the satellite view." : place}
                </p>
              </div>
              {hasLocation && (
                <div className="flex gap-2">
                  <a href={googleMapsUrl(l.lat!, l.lng!)} target="_blank" rel="noopener" className="btn-ghost h-9 text-xs">
                    <ExternalLink className="size-3.5" /> Google Maps
                  </a>
                  <a href={directionsUrl(l.lat!, l.lng!)} target="_blank" rel="noopener" className="btn-dark h-9 text-xs">
                    <Navigation className="size-3.5" /> Directions
                  </a>
                </div>
              )}
            </div>
            {hasLocation ? (
              <div className="card h-[380px] overflow-hidden sm:h-[460px]">
                <PlotMap lat={l.lat!} lng={l.lng!} boundary={l.boundary} sold={l.status === "sold"} />
              </div>
            ) : (
              <div className="card p-6 text-sm text-muted">Exact location is shared on request — contact us for a site visit.</div>
            )}
          </section>

          {/* Land record */}
          <section>
            <h2 className="text-lg font-bold tracking-tight">Land record &amp; khasra map</h2>
            <p className="mb-3 text-sm text-muted">Use these details to verify ownership on the official UP Government portals.</p>
            <div className="card divide-y divide-line">
              <dl className="grid gap-x-6 p-5 sm:grid-cols-2">
                {record.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="flex items-center gap-1 text-right font-semibold">
                      {v}
                      {k.startsWith("Khas") && <CopyButton text={v} label={k} />}
                    </dd>
                  </div>
                ))}
              </dl>
              {l.khasra_map && (
                <div className="p-5">
                  <KhasraMapViewer file={l.khasra_map} khasra={l.khasra_no} />
                </div>
              )}
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <a href={landRecordLinks.bhulekh} target="_blank" rel="noopener" className="group flex items-start gap-3 rounded-xl border border-line p-4 transition hover:border-brand-500 hover:bg-brand-50/40">
                  <FileText className="mt-0.5 size-5 text-brand-600" />
                  <span className="flex-1">
                    <span className="flex items-center gap-1 font-semibold">UP Bhulekh <ArrowUpRight className="size-4 text-muted group-hover:text-brand-600" /></span>
                    <span className="text-sm text-muted">Check khatauni &amp; owner name using the khasra no.</span>
                  </span>
                </a>
                <a href={landRecordLinks.bhunaksha} target="_blank" rel="noopener" className="group flex items-start gap-3 rounded-xl border border-line p-4 transition hover:border-brand-500 hover:bg-brand-50/40">
                  <MapPin className="mt-0.5 size-5 text-brand-600" />
                  <span className="flex-1">
                    <span className="flex items-center gap-1 font-semibold">UP Bhu-Naksha <ArrowUpRight className="size-4 text-muted group-hover:text-brand-600" /></span>
                    <span className="text-sm text-muted">View the official cadastral map: {l.district} → {l.tehsil ?? "tehsil"} → {l.village}.</span>
                  </span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Price & contact */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6 shadow-xl shadow-slate-900/5">
            <p className="text-sm text-muted">{l.price_basis === "per_unit" ? "Rate" : "Price"}</p>
            <p className="text-3xl font-bold tracking-tight">{priceLine(l)}</p>
            {total && <p className="mt-1 text-sm text-muted">≈ {formatPrice(total)} total for {formatArea(l.area, l.area_unit)}</p>}
            {l.negotiable && <p className="chip mt-3 bg-brand-50 text-brand-700">Negotiable</p>}

            <div className="mt-6 grid gap-2.5">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener" className="btn-whatsapp h-12">
                  <WhatsAppIcon className="size-5" /> Enquire on WhatsApp
                </a>
              )}
              {site.phone && (
                <a href={`tel:${site.phone}`} className="btn-dark h-12">
                  <Phone className="size-4" /> Call {site.phone}
                </a>
              )}
              {hasLocation && (
                <a href={directionsUrl(l.lat!, l.lng!)} target="_blank" rel="noopener" className="btn-ghost h-12">
                  <Navigation className="size-4" /> Get directions for site visit
                </a>
              )}
            </div>
            <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
              Listed {timeAgo(l.created_at)} · Ref #{l.id}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky contact bar */}
      <div className="mobile-cta fixed inset-x-0 bottom-0 z-[1000] flex items-center gap-2 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{priceLine(l)}</p>
          <p className="truncate text-xs text-muted">Khasra {l.khasra_no} · {l.village}</p>
        </div>
        {site.phone && (
          <a href={`tel:${site.phone}`} className="btn-dark size-11 p-0" aria-label="Call"><Phone className="size-4" /></a>
        )}
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener" className="btn-whatsapp px-4"><WhatsAppIcon className="size-5" /> WhatsApp</a>
        )}
      </div>
    </div>
  );
}
