"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { formatWib } from "@/lib/dateUtils";

const FILTERS = [
  { value: "", label: "All Activity" },
  { value: "admin", label: "Admin Activity" },
  { value: "user", label: "User Activity" },
];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  async function loadLogs() {
    try {
      setLoading(true);
      setError(null);

      const query = filter ? `?actor_type=${encodeURIComponent(filter)}` : "";

      const result = await apiClient.get(`/admin/activity-logs${query}`, true);

      setLogs(result.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>

          <p className="mt-1 text-sm text-slate-500">
            View recent activity and changes made in the system.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-5 flex overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
                filter === item.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-4 font-semibold hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {logs.map((log, index) => (
              <ActivityItem
                key={log.id}
                log={log}
                isLast={index === logs.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ log, isLast }) {
  const details =
    log.details && typeof log.details === "object"
      ? Object.entries(log.details)
      : [];

  return (
    <div
      className={`relative px-5 py-5 md:px-6 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      <div className="flex gap-4">
        {/* Actor avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {getInitials(log.actor_name)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">
                {log.actor_name || "Unknown"}
              </span>{" "}
              <span className="text-slate-500">{formatAction(log.action)}</span>
            </p>

            <time className="shrink-0 text-xs text-slate-400">
              {formatWib(log.created_at)}
            </time>
          </div>

          {/* Target */}
          {log.target_label && (
            <div className="mt-2 text-sm">
              <span className="text-slate-400">Target:</span>{" "}
              <span className="font-medium text-slate-700">
                {log.target_label}
              </span>
            </div>
          )}

          {/* Changes */}
          {details.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {details.map(([field, change]) => (
                <ChangeItem key={field} field={field} change={change} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangeItem({ field, change }) {
  const from = change?.from ?? "-";
  const to = change?.to ?? "-";

  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-32 shrink-0 text-xs font-medium text-slate-500">
        {formatFieldName(field)}
      </span>

      <div className="min-w-0 text-xs">
        <span className="break-words text-slate-400">{String(from)}</span>

        <span className="mx-2 text-slate-300">→</span>

        <span className="break-words font-medium text-slate-700">
          {String(to)}
        </span>
      </div>
    </div>
  );
}

function formatFieldName(field) {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

      <p className="text-sm text-slate-500">Loading activity...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
        ↕
      </div>

      <h2 className="font-semibold text-slate-900">No activity found</h2>

      <p className="mt-1 text-sm text-slate-500">
        There are no activity logs matching this filter.
      </p>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatAction(action) {
  if (!action) return "performed an action";

  return action.replace(/_/g, " ").toLowerCase();
}
