import { STATUSES, type Status } from "@/lib/constants";

const STYLES: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  booked: "bg-amber-100 text-amber-800",
  sold: "bg-slate-800 text-white",
  draft: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status === "draft" ? "Draft" : (STATUSES[status as Status] ?? status);
  return <span className={`chip ${STYLES[status] ?? STYLES.draft}`}>{label}</span>;
}
