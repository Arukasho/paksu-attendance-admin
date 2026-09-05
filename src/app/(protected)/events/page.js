"use client";

import useSWR, { mutate } from "swr";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { fetcher } from "@/lib/apiClient";
import { formatWib, toWibInputValue, fromWibInputValue } from "@/lib/dateUtils";
import { OfflineBanner } from "@/components/OfflineBanner";
import { exportToCsv } from "@/lib/csvExport";

const EVENT_ATTENDANCE_EXPORT_COLUMNS = [
  { label: "Full Name", key: "full_name" },
  { label: "Asal Universitas", key: "university" },
  { label: "Kehadiran", format: (row) => (row.attended ? "Yes" : "No") },
  { label: "Check-In Pukul", key: "checked_in_at" },
];

export default function EventsPage() {
  const { data: result, isLoading } = useSWR("/admin/events", fetcher);
  const events = result?.data || [];
  const offline = result?.code === "network_error";

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [viewingAttendeesId, setViewingAttendeesId] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Delete this event?")) return;
    await apiClient.delete(`/admin/events/${id}`, true);
    mutate("/admin/events"); // tell SWR this key is stale, refetch it
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Kegiatan</h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola data kegiatan dan catatan kehadiran anggota.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            + Buat Kegiatan
          </button>
        </div>

        {offline && <OfflineBanner />}

        {/* Content */}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">Memuat kegiatan...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📅
            </div>

            <h2 className="font-semibold text-slate-900">Belum ada kegiatan</h2>

            <p className="mt-1 text-sm text-slate-500">
              Buat kegiatan pertama Anda untuk memulai.
            </p>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Buat Kegiatan
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Kegiatan
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tanggal & Waktu
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Lokasi
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Jumlah Kehadiran
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {events.map((event) => (
                    <EventTableRow
                      key={event.id}
                      event={event}
                      onViewAttendees={() => setViewingAttendeesId(event.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add */}
      {showAddForm && (
        <CreateEventModal
          onClose={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false);
            mutate("/admin/events");
          }}
        />
      )}

      {/* View Attendees */}
      {viewingAttendeesId && (
        <EventAttendeesModal
          id={viewingAttendeesId}
          onClose={() => setViewingAttendeesId(null)}
          onEdit={() => {
            setViewingAttendeesId(null);
            setEditingEventId(viewingAttendeesId);
          }}
          onDelete={async () => {
            await handleDelete(viewingAttendeesId);
            setViewingAttendeesId(null);
          }}
        />
      )}

      {/* Edit */}
      {editingEventId && (
        <EditEventModal
          id={editingEventId}
          onClose={() => setEditingEventId(null)}
          onSaved={() => {
            setEditingEventId(null);
            mutate("/admin/events");
          }}
        />
      )}
    </div>
  );
}

function EventTableRow({ event, onViewAttendees }) {
  const attendeeCount = event.attended_count ?? 0;

  return (
    <tr className="transition hover:bg-slate-50">
      {/* Event */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm">
            📅
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {event.name || "-"}
            </p>
          </div>
        </div>
      </td>

      {/* Date & Time */}
      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatWib(event.event_datetime)}
      </td>

      {/* Location */}
      <td className="max-w-[200px] truncate px-6 py-4 text-sm text-slate-600">
        {event.location || "-"}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge isActive={event.is_active} />
      </td>

      {/* Attendees */}
      <td className="px-6 py-4 text-right text-sm text-slate-600">
        <span className="font-semibold text-slate-800">{attendeeCount}</span>
      </td>

      {/* Action */}
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={onViewAttendees}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-green-500" : "bg-slate-400"
        }`}
      />

      {isActive ? "Aktif" : "Tidak Aktif"}
    </span>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-xl`}>
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>

              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [eventDatetime, setEventDatetime] = useState("");
  const [location, setLocation] = useState("");
  const [openMinutes, setOpenMinutes] = useState(120);
  const [closeMinutes, setCloseMinutes] = useState(60);
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const eventDatetimeIso = fromWibInputValue(eventDatetime);

    if (!eventDatetimeIso) {
      setError("Please enter a complete, valid date and time.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await apiClient.post(
        "/admin/events",
        {
          name: name.trim(),
          event_datetime: eventDatetimeIso,
          location: location.trim(),
          checkin_open_minutes: Number(openMinutes),
          checkin_close_minutes: Number(closeMinutes),
          is_active: isActive,
        },
        true,
      );

      if (!result.data) {
        setError(result.message || "Failed to create event.");
        return;
      }

      onCreated();
    } catch (err) {
      console.error(err);
      setError("Failed to create event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Buat Kegiatan Baru"
      description="Buat kegiatan baru dan atur range waktu check-in-nya."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <FormField
            label="Nama Kegiatan"
            value={name}
            onChange={setName}
            placeholder="Nama Kegiatan"
            required
          />

          <FormField
            label="Tanggal & Waktu Kegiatan"
            value={eventDatetime}
            onChange={setEventDatetime}
            type="datetime-local"
            required
          />

          <FormField
            label="Lokasi"
            value={location}
            onChange={setLocation}
            placeholder="Lokasi"
          />

          <FormField
            label="Check-in dibuka"
            value={openMinutes / 60}
            onChange={(value) => setOpenMinutes(Number(value) * 60)}
            type="number"
            min="0"
            step="0.5"
            suffix="jam sebelum mulai"
            required
          />

          <FormField
            label="Check-in ditutup"
            value={closeMinutes / 60}
            onChange={(value) => setCloseMinutes(Number(value) * 60)}
            type="number"
            min="0"
            step="0.5"
            suffix="jam setelah mulai"
            required
          />

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Aktif
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <ModalFooter
          onClose={onClose}
          submitText="Create Event"
          loading={saving}
        />
      </form>
    </Modal>
  );
}

function EventAttendeesModal({ id, onClose, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [marking, setMarking] = useState(null);
  const [actionError, setActionError] = useState(null);

  const trimmedSearch = submittedSearch.trim();
  const query = trimmedSearch
    ? `?search=${encodeURIComponent(trimmedSearch)}`
    : "";
  const swrKey = `/admin/dashboard/events/${id}/attendance/full${query}`;

  const { data: result, mutate: refresh } = useSWR(swrKey, fetcher, {
    refreshInterval: 10000,
  });

  const loadError =
    result?.code === "network_error"
      ? "You're offline. Check your internet connection and try again."
      : result && !result.data
        ? "Failed to load attendees."
        : null;

  const data = result?.data;
  const attendees = data?.attendees || [];
  const attendedCount = attendees.filter((a) => a.attended).length;

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSubmittedSearch(search);
  }

  function handleSearchChange(value) {
    setSearch(value);
    if (!value.trim()) {
      setSubmittedSearch("");
    }
  }

  async function handleMark(userId) {
    try {
      setMarking(userId);
      setActionError(null);

      const markResult = await apiClient.post(
        `/admin/dashboard/events/${id}/attendance/${userId}`,
        {},
        true,
      );

      if (!markResult.data && markResult.message) {
        setActionError(markResult.message);
        return;
      }

      await refresh();
    } catch (err) {
      console.error(err);
      setActionError("Failed to mark participant as present.");
    } finally {
      setMarking(null);
    }
  }

  async function handleExport() {
    const filename = `${data.event.name.replace(/[^a-z0-9]/gi, "_")}_attendance.csv`;
    exportToCsv(filename, EVENT_ATTENDANCE_EXPORT_COLUMNS, data.attendees);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {data ? (
                <>
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {data.event?.name || "Event Attendees"}
                  </h2>

                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700">
                      {attendedCount}
                    </span>

                    <span className="text-slate-400">/</span>

                    <span className="text-slate-500">
                      {attendees.length} orang hadir
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-900">
                    Kehadiran Kegiatan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Memuat Kehadiran...
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama anggota..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cari
            </button>
          </form>

          {/* Error */}
          {loadError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {loadError}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 px-6 py-5">
          {!data ? (
            <div className="flex min-h-40 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <span>Memuat Kehadiran...</span>
              </div>
            </div>
          ) : attendees.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg">
                🔎
              </div>

              <h3 className="font-semibold text-slate-900">
                {search.trim()
                  ? "Anggota tidak ditemukan"
                  : "Belum ada yang hadir"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search.trim()
                  ? "Coba kata kunci pencarian berbeda."
                  : "Belum ada kehadiran di acara ini."}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hadirin
                </p>

                <p className="text-xs text-slate-400">
                  {attendees.length} {"hadirin"}
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {attendees.map((attendee, index) => (
                  <AttendeeRow
                    key={attendee.user_id}
                    attendee={attendee}
                    isLast={index === attendees.length - 1}
                    marking={marking === attendee.user_id}
                    onMark={() => handleMark(attendee.user_id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Hapus
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendeeRow({ attendee, isLast, marking, onMark }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 transition hover:bg-slate-50 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      {/* Participant */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {getInitials(attendee.full_name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {attendee.full_name || "-"}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {attendee.university || "-"} - {attendee.stambuk || "-"}
          </p>
        </div>
      </div>

      {/* Statuses */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Form Status */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            attendee.already_fill_form
              ? "bg-green-50 text-green-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              attendee.already_fill_form ? "bg-green-500" : "bg-orange-500"
            }`}
          />
          {attendee.already_fill_form ? "Sudah Isi Form" : "Belum Isi Form"}
        </span>

        {/* Attendance Status */}
        {attendee.attended ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Hadir
            </span>

            {attendee.checked_in_at && (
              <span className="text-[11px] text-slate-400">
                {formatCheckInTime(attendee.checked_in_at)}
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onMark}
            disabled={marking}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {marking ? "Menandai..." : "Tandai Hadir"}
          </button>
        )}
      </div>
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

function formatCheckInTime(value) {
  return new Date(value).toLocaleTimeString("en-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EditEventModal({ id, onClose, onSaved }) {
  const { data: result } = useSWR(`/admin/events/${id}`, fetcher);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!result) return;

    if (result.code === "network_error") {
      setError("You're offline. Check your internet connection and try again.");
      return;
    }

    if (result.data) {
      setForm({
        ...result.data,
        event_datetime: toWibInputValue(result.data.event_datetime),
        is_active: Boolean(result.data.is_active),
      });
    } else {
      setError("Failed to load event.");
    }
  }, [result]);

  async function handleSubmit(e) {
    e.preventDefault();

    const eventDatetimeIso = fromWibInputValue(form.event_datetime);

    if (!eventDatetimeIso) {
      setError("Please enter a complete, valid date and time.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await apiClient.patch(
        `/admin/events/${id}`,
        {
          name: form.name.trim(),
          event_datetime: eventDatetimeIso,
          location: form.location?.trim() || "",
          checkin_open_minutes: Number(form.checkin_open_minutes),
          checkin_close_minutes: Number(form.checkin_close_minutes),
          is_active: form.is_active,
        },
        true,
      );

      if (!result.data) {
        setError(result.message || "Gagal Update Kegiatan.");
        return;
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setError("Gagal Update Kegiatan.");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
        <div className="rounded-xl bg-white px-8 py-6 shadow-xl">
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              Memuat Kegiatan...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal
      title="Edit Event"
      description="Update the event information and check-in settings."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <FormField
            label="Nama Kegiatan"
            value={form.name || ""}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Event name"
            required
          />

          <FormField
            label="Tanggal & Waktu Kegiatan"
            value={form.event_datetime || ""}
            onChange={(value) => setForm({ ...form, event_datetime: value })}
            type="datetime-local"
            min="2000-01-01T00:00"
            max="3000-12-31T23:59"
            required
          />

          <FormField
            label="Lokasi"
            value={form.location || ""}
            onChange={(value) => setForm({ ...form, location: value })}
            placeholder="Location"
          />

          <FormField
            label="Check-in dibuka"
            value={Number(form.checkin_open_minutes || 0) / 60}
            onChange={(value) =>
              setForm({
                ...form,
                checkin_open_minutes: Number(value) * 60,
              })
            }
            type="number"
            min="0"
            step="0.5"
            suffix="jam sebelum mulai"
            required
          />

          <FormField
            label="Check-in ditutup"
            value={Number(form.checkin_close_minutes || 0) / 60}
            onChange={(value) =>
              setForm({
                ...form,
                checkin_close_minutes: Number(value) * 60,
              })
            }
            type="number"
            min="0"
            step="0.5"
            suffix="jam setelah mulai"
            required
          />

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Aktif
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <ModalFooter
          onClose={onClose}
          submitText="Save Changes"
          loading={saving}
        />
      </form>
    </Modal>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
  max,
  step,
  suffix,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          required={required}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {suffix && (
          <span className="shrink-0 text-sm text-slate-400">{suffix}</span>
        )}
      </div>
    </label>
  );
}

function ModalFooter({
  onClose,
  submitText,
  loading = false,
  hideSubmit = false,
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {hideSubmit ? "Close" : "Cancel"}
      </button>

      {!hideSubmit && (
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : submitText}
        </button>
      )}
    </div>
  );
}
