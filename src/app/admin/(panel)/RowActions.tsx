"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { STATUSES } from "@/lib/constants";
import { deleteListingAction, setStatusAction } from "../actions";

export function RowActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className={`flex w-full items-center gap-2 sm:w-auto ${pending ? "pointer-events-none opacity-50" : ""}`}>
      <select
        defaultValue={status}
        onChange={(e) => start(() => setStatusAction(id, e.target.value))}
        className="input h-9 w-auto flex-1 text-xs sm:flex-none"
        aria-label="Status"
      >
        {Object.entries(STATUSES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <Link href={`/plots/${id}`} target="_blank" className="btn-ghost size-9 p-0" title="View on site"><ExternalLink className="size-4" /></Link>
      <Link href={`/admin/listings/${id}`} className="btn-ghost size-9 p-0" title="Edit"><Pencil className="size-4" /></Link>
      <button
        className="btn-ghost size-9 p-0 text-red-600 hover:bg-red-50"
        title="Delete"
        onClick={() => {
          if (confirm("Delete this listing permanently? Photos and khasra map will also be removed.")) {
            start(() => deleteListingAction(id));
          }
        }}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
