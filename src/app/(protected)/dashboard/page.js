"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { formatWib } from "@/lib/dateUtils";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.get("/admin/dashboard/summary", true);

        if (result.code === "network_error") {
          setError(
            "You're offline. Check your internet connection and try again.",
          );
          setSummary(null);
          return;
        }

        setSummary(result.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (offline)
    return (
      <div className="p-8">
        <OfflineBanner />
      </div>
    );

  if (error) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const event = summary?.active_event;

  if (!event) {
    return (
      <div className="min-h-full bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

            <p className="mt-1 text-sm text-slate-500">
              Overview of your event attendance.
            </p>
          </div>

          {/* Empty state */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📅
            </div>

            <h2 className="font-semibold text-slate-900">No active event</h2>

            <p className="mt-1 text-sm text-slate-500">
              There is no active event scheduled for today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your event attendance.
          </p>
        </div>

        {/* Active event */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg">
                📅
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Event
                </p>

                <h2 className="truncate text-lg font-bold text-slate-900">
                  {event.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 sm:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Active
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Registered"
            value={event.registered}
            description="Total registered"
            icon="👥"
          />

          <StatCard
            label="Attending"
            value={event.attending}
            description="Checked in"
            icon="✓"
            variant="success"
          />

          <StatCard
            label="Not Attended"
            value={event.not_attended}
            description="Not checked in"
            icon="—"
            variant="warning"
          />

          <StatCard
            label="Attendance Rate"
            value={`${event.attendance_rate}%`}
            description="Overall attendance"
            icon="%"
            variant="blue"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, description, icon, variant = "default" }) {
  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            iconStyles[variant]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
