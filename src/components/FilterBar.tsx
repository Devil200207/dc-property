"use client";

import { Search } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/constants";

const BUDGETS = [
  ["1000000", "Under ₹10 Lakh"],
  ["2500000", "Under ₹25 Lakh"],
  ["5000000", "Under ₹50 Lakh"],
  ["10000000", "Under ₹1 Cr"],
  ["25000000", "Under ₹2.5 Cr"],
  ["50000000", "Under ₹5 Cr"],
];

type Values = { q?: string; type?: string; tehsil?: string; budget?: string; sort?: string; view?: string };

export function FilterBar({ values, tehsils }: { values: Values; tehsils: string[] }) {
  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  return (
    <form action="/" className="card grid gap-2 p-2 shadow-xl shadow-slate-900/5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
      {values.view === "map" && <input type="hidden" name="view" value="map" />}
      {values.sort && <input type="hidden" name="sort" value={values.sort} />}
      <label className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={values.q}
          placeholder="Village, khasra no. or landmark"
          className="input h-12 border-transparent bg-slate-50 pl-10 focus:bg-white"
          aria-label="Search"
        />
      </label>
      <select name="type" defaultValue={values.type ?? ""} onChange={submitOnChange} className="input h-12 border-transparent bg-slate-50" aria-label="Property type">
        <option value="">All property types</option>
        {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <select name="tehsil" defaultValue={values.tehsil ?? ""} onChange={submitOnChange} className="input h-12 border-transparent bg-slate-50" aria-label="Tehsil">
        <option value="">All tehsils</option>
        {tehsils.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select name="budget" defaultValue={values.budget ?? ""} onChange={submitOnChange} className="input h-12 border-transparent bg-slate-50" aria-label="Budget">
        <option value="">Any budget</option>
        {BUDGETS.map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
      <button className="btn-primary h-12 px-6">Search</button>
    </form>
  );
}
