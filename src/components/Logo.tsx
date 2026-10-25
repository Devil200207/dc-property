import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-sm font-extrabold tracking-tight text-white shadow-sm">
        DC
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
          {site.name}
        </span>
        <span className={`block text-[11px] font-medium ${light ? "text-white/60" : "text-muted"}`}>
          Plots &amp; Land · Braj
        </span>
      </span>
    </Link>
  );
}
