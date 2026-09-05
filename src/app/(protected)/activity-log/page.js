"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { formatWib } from "@/lib/dateUtils";

const FILTERS = [
  { value: "", label: "Semua Aktivitas" },
  { value: "admin", label: "Aktivitas Admin" },
  { value: "user", label: "Aktivitas User" },
];

const PAGE_SIZE = 50;

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [filter, page]);

  async function loadLogs() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (filter) {
        params.set("actor_type", filter);
      }

      const result = await apiClient.get(
        `/admin/activity-logs?${params.toString()}`,
        true,
      );

      if (!result.data) {
        setLogs([]);
        setMeta(null);
        setError("Gagal memuat aktivitas.");
        return;
      }

      setLogs(result.data || []);
      setMeta(result.meta || null);
    } catch (err) {
      console.error(err);
      setLogs([]);
      setMeta(null);
      setError("Gagal memuat aktivitas.");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(value) {
    setFilter(value);
    setPage(1);
  }

  const totalPages = meta?.total_pages ?? 1;
  const totalLogs = meta?.total ?? 0;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Log Aktivitas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Pantau aktivitas dan perubahan terbaru pada sistem.
          </p>
        </header>

        <div className="mb-5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="flex min-w-max">
            {FILTERS.map((item) => {
              const active = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleFilterChange(item.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Tutup pesan error"
              className="ml-4 text-lg leading-none text-red-500 transition hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {logs.map((log, index) => (
                <ActivityItem
                  key={log.id}
                  log={log}
                  isLast={index === logs.length - 1}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  <span>Halaman </span>
                  <span className="font-medium text-slate-700">{page}</span>
                  <span> dari </span>
                  <span className="font-medium text-slate-700">
                    {totalPages}
                  </span>
                  <span className="mx-1.5 text-slate-300">•</span>
                  <span>{totalLogs.toLocaleString("id-ID")} aktivitas</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    ← Sebelumnya
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </>
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
    <article
      className={`px-5 py-5 md:px-6 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {getInitials(log.actor_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">
                {log.actor_name || "Unknown"}
              </span>
              <span className="ml-1.5 text-slate-500">
                {formatAction(log.action)}
              </span>
            </p>

            <time
              dateTime={log.created_at}
              className="shrink-0 text-xs text-slate-400"
            >
              {formatWib(log.created_at)}
            </time>
          </div>

          {log.target_label && (
            <div className="mt-2 text-sm">
              <span className="text-slate-400">Target:</span>
              <span className="ml-1.5 font-medium text-slate-700">
                {log.target_label}
              </span>
            </div>
          )}

          {details.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {details.map(([field, change]) => (
                <ChangeItem key={field} field={field} change={change} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ChangeItem({ field, change }) {
  const from = change?.from ?? "-";
  const to = change?.to ?? "-";

  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-xs font-medium text-slate-500 sm:w-32">
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

      <p className="text-sm text-slate-500">Memuat aktivitas...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
        ↕
      </div>

      <h2 className="font-semibold text-slate-900">Tidak ada aktivitas</h2>

      <p className="mt-1 text-sm text-slate-500">
        Tidak ada catatan aktivitas yang sesuai dengan filter.
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
