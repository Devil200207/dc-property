import { Logo } from "./Logo";
import { site, landRecordLinks } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-brand-900 text-white/70">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo light />
          <p className="max-w-xs text-sm">{site.tagline}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Contact</p>
          {site.phone && <a href={`tel:${site.phone}`} className="block hover:text-white">{site.phone}</a>}
          <p>{site.address}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Verify land records</p>
          <a href={landRecordLinks.bhulekh} target="_blank" rel="noopener" className="block hover:text-white">UP Bhulekh (Khatauni)</a>
          <a href={landRecordLinks.bhunaksha} target="_blank" rel="noopener" className="block hover:text-white">UP Bhu-Naksha (Khasra map)</a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-white/50">
          © {new Date().getFullYear()} {site.name}. Details are provided for reference — buyers should verify records with the tehsil before purchase.
        </p>
      </div>
    </footer>
  );
}
