import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-6 shadow-xl shadow-slate-900/5">
          <h1 className="text-lg font-bold">Admin login</h1>
          <p className="mb-5 text-sm text-muted">Manage your property listings.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
