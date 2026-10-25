import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <MapPinOff className="mx-auto size-10 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold">This property isn&apos;t available</h1>
        <p className="mt-1 text-sm text-muted">It may have been sold or removed.</p>
        <Link href="/" className="btn-primary mt-6">See all properties</Link>
      </div>
    </div>
  );
}
