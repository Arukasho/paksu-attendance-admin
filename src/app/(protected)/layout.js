"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, clearTokens } from "@/lib/auth";

export default function ProtectedLayout({ children }) {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  if (!checked) return null; // brief blank screen while checking — avoids flashing protected content

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 p-4 text-white">
        <h2 className="mb-6 text-lg font-bold">Paksu Admin</h2>
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Dashboard
          </Link>
          <Link
            href="/events"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Events
          </Link>
          <Link
            href="/participants"
            className="block rounded px-3 py-2 hover:bg-slate-800"
          >
            Participants
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-8 block w-full rounded px-3 py-2 text-left hover:bg-slate-800"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
