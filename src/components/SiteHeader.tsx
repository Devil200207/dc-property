import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link href="/" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink sm:block">
            Properties
          </Link>
          <Link href="/?view=map" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-ink sm:block">
            Map
          </Link>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" className="btn-ghost h-10 px-3" aria-label="WhatsApp">
              <WhatsAppIcon className="size-4 text-[#25D366]" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>
          )}
          {site.phone && (
            <a href={`tel:${site.phone}`} className="btn-primary h-10 px-3.5">
              <Phone className="size-4" />
              <span className="hidden sm:inline">Call us</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
