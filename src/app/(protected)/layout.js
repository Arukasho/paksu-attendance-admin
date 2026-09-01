"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, clearTokens, getUser } from "@/lib/auth";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "▦",
  },
  {
    href: "/events",
    label: "Events",
    icon: "◷",
  },
  {
    href: "/participants",
    label: "Participants",
    icon: "♙",
  },
  {
    href: "/activity-log",
    label: "Activity Log",
    icon: "⫶☰",
  },
];

export default function ProtectedLayout({ children }) {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setUser(getUser());
    setChecked(true);
  }, [router]);

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo / Brand */}
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg">
              <img
                src="splash_icon.png"
                alt="PAKSU Attendance App Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-sm font-bold text-slate-900">PAKSU</h1>

              <p className="text-[11px] text-slate-400">
                Attendance Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Management
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-sm ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span>{item.label}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-3">
          {user && (
            <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                {getInitials(user.full_name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.full_name}
                </p>

                <p className="truncate text-xs text-slate-400">
                  @{user.username}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm">
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen flex-1 bg-slate-50">{children}</main>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
