import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { logout } from "../actions";

export const metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[1000] border-b border-line bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="chip bg-slate-100 text-slate-600">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="btn-ghost h-9 text-xs"><ExternalLink className="size-3.5" /> <span className="hidden sm:inline">View site</span></Link>
            <form action={logout}>
              <button className="btn-ghost h-9 text-xs"><LogOut className="size-3.5" /> <span className="hidden sm:inline">Log out</span></button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
