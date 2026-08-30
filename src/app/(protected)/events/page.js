"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { formatWib, toWibInputValue, fromWibInputValue } from "@/lib/dateUtils";
import { OfflineBanner } from "@/components/OfflineBanner";
import { exportToCsv } from "@/lib/csvExport";

const EVENT_ATTENDANCE_EXPORT_COLUMNS = [
  { label: "Full Name", key: "full_name" },
  { label: "University", key: "university" },
  { label: "Attended", format: (row) => (row.attended ? "Yes" : "No") },
  { label: "Checked In At", key: "checked_in_at" },
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingAttendeesId, setViewingAttendeesId] = useState(null);

  async function loadEvents() {
    setLoading(true);
    const result = await apiClient.get("/admin/events", true);
    setOffline(result.code === "network_error");
    setEvents(result.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?",
    );

    if (!confirmed) return;

    try {
      setError(null);

      await apiClient.delete(`/admin/events/${id}`, true);
      await loadEvents();
    } catch (err) {
      console.error(err);
      setError("Failed to delete event.");
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Events</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your events and attendance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            + Create Event
          </button>
        </div>

        {offline && <OfflineBanner />}

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
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📅
            </div>

            <h2 className="font-semibold text-slate-900">No events yet</h2>

            <p className="mt-1 text-sm text-slate-500">
              Create your first event to get started.
            </p>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {events.map((event, index) => (
              <EventRow
                key={event.id}
                event={event}
                isLast={index === events.length - 1}
                onViewAttendees={() => setViewingAttendeesId(event.id)}
                onEdit={() => setEditingId(event.id)}
                onDelete={() => handleDelete(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add */}
      {showAddForm && (
        <CreateEventModal
          onClose={() => setShowAddForm(false)}
          onCreated={async () => {
            setShowAddForm(false);
            await loadEvents();
          }}
        />
      )}

      {/* View Attendees */}
      {viewingAttendeesId && (
        <EventAttendeesModal
          id={viewingAttendeesId}
          onClose={() => setViewingAttendeesId(null)}
        />
      )}

      {/* Edit */}
      {editingId && (
        <EditEventModal
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={async () => {
            setEditingId(null);
            await loadEvents();
          }}
        />
      )}
    </div>
  );
}

function EventRow({ event, isLast, onViewAttendees, onEdit, onDelete }) {
  const attendeeCount = event.attended_count ?? 0;

  return (
    <div
      className={`p-5 transition hover:bg-slate-50 md:px-6 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Event information */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Calendar icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm">
            📅
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {event.name || "-"}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>{formatWib(event.event_datetime)}</span>

              {event.location && (
                <>
                  <span>•</span>
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <StatusBadge isActive={event.is_active} />

          <div className="mr-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">
              {attendeeCount}
            </span>{" "}
            {attendeeCount === 1 ? "attendee" : "attendees"}
          </div>

          <div className="hidden h-5 w-px bg-slate-200 lg:block" />

          <button
            type="button"
            onClick={onViewAttendees}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            View Attendees
          </button>

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
            Delete
          </button>
        </div>
      </div>
    </div>
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

      {isActive ? "Active" : "Inactive"}
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
      title="Create Event"
      description="Create a new event and configure its check-in window."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <FormField
            label="Event Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Annual Gathering 2026"
            required
          />

          <FormField
            label="Event Date & Time"
            value={eventDatetime}
            onChange={setEventDatetime}
            type="datetime-local"
            required
          />

          <FormField
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="e.g. Jakarta Convention Center"
          />

          <FormField
            label="Check-in opens"
            value={openMinutes / 60}
            onChange={(value) => setOpenMinutes(Number(value) * 60)}
            type="number"
            min="0"
            step="0.5"
            suffix="hours before"
            required
          />

          <FormField
            label="Check-in closes"
            value={closeMinutes / 60}
            onChange={(value) => setCloseMinutes(Number(value) * 60)}
            type="number"
            min="0"
            step="0.5"
            suffix="hours after start"
            required
          />

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

function EventAttendeesModal({ id, onClose }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [marking, setMarking] = useState(null);
  const [error, setError] = useState(null);

  async function load(searchValue = search) {
    try {
      setError(null);

      const trimmedSearch = searchValue.trim();

      const query = trimmedSearch
        ? `?search=${encodeURIComponent(trimmedSearch)}`
        : "";

      const result = await apiClient.get(
        `/admin/dashboard/events/${id}/attendance/full${query}`,
        true,
      );

      setData(result.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load attendees.");
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load(search);
    }, 4000);

    return () => clearInterval(interval);

    // We intentionally only restart polling when the event ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSearchSubmit(e) {
    e.preventDefault();
    await load(search);
  }

  async function handleSearchChange(value) {
    setSearch(value);

    // Restore the complete attendee list when search is cleared.
    if (!value.trim()) {
      await load("");
    }
  }

  async function handleMark(userId) {
    try {
      setMarking(userId);
      setError(null);

      const result = await apiClient.post(
        `/admin/dashboard/events/${id}/attendance/${userId}`,
        {},
        true,
      );

      if (!result.data && result.message) {
        setError(result.message);
        return;
      }

      await load(search);
    } catch (err) {
      console.error(err);
      setError("Failed to mark participant as present.");
    } finally {
      setMarking(null);
    }
  }

  const attendees = data?.attendees || [];

  const attendedCount = attendees.filter(
    (attendee) => attendee.attended,
  ).length;

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
                      {attendees.length} attended
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-900">
                    Event Attendees
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Loading attendance...
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
                placeholder="Search participant name..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Search
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 px-6 py-5">
          {!data ? (
            <div className="flex min-h-40 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <span>Loading attendees...</span>
              </div>
            </div>
          ) : attendees.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg">
                🔎
              </div>

              <h3 className="font-semibold text-slate-900">
                {search.trim()
                  ? "No participants found"
                  : "No participants yet"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "No participants are currently registered for this event."}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Participants
                </p>

                <p className="text-xs text-slate-400">
                  {attendees.length}{" "}
                  {attendees.length === 1 ? "participant" : "participants"}
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
        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            onClick={handleExport}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendeeRow({ attendee, isLast, marking, onMark }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-slate-50 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      {/* Participant */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {getInitials(attendee.full_name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {attendee.full_name || "-"}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {attendee.university || "-"}
          </p>
        </div>
      </div>

      {/* Attendance status */}
      <div className="shrink-0">
        {attendee.attended ? (
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Present
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
            {marking ? "Marking..." : "Mark Present"}
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
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadEvent() {
      try {
        setError(null);

        const result = await apiClient.get(`/admin/events/${id}`, true);

        if (mounted) {
          setForm({
            ...result.data,
            event_datetime: toWibInputValue(result.data.event_datetime),
          });
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Failed to load event.");
        }
      }
    }

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [id]);

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
        setError(result.message || "Failed to update event.");
        return;
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setError("Failed to update event.");
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
              Loading event...
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
            label="Event Name"
            value={form.name || ""}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Event name"
            required
          />

          <FormField
            label="Event Date & Time"
            value={form.event_datetime || ""}
            onChange={(value) => setForm({ ...form, event_datetime: value })}
            type="datetime-local"
            min="2000-01-01T00:00"
            max="3000-12-31T23:59"
            required
          />

          <FormField
            label="Location"
            value={form.location || ""}
            onChange={(value) => setForm({ ...form, location: value })}
            placeholder="Location"
          />

          <FormField
            label="Check-in opens"
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
            suffix="hours before"
            required
          />

          <FormField
            label="Check-in closes"
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
            suffix="hours after start"
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
            Active
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
