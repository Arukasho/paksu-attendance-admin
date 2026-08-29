"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/dashboard/summary", true).then((result) => {
      setSummary(result.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-8">Loading...</p>;

  const event = summary?.active_event;

  if (!event) {
    return <p className="p-8">No active event today.</p>;
  }

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-main">{event.name}</p>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Registered" value={event.registered} />
        <StatCard label="Attending" value={event.attending} />
        <StatCard label="Not Attended" value={event.not_attended} />
        <StatCard label="Attendance Rate" value={`${event.attendance_rate}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <p className="text-sm text-main">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
