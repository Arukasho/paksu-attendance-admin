"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { formatWib, toWibInputValue, fromWibInputValue } from "@/lib/dateUtils";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingAttendeesId, setViewingAttendeesId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  async function loadEvents() {
    setLoading(true);
    const result = await apiClient.get("/admin/events", true);
    setEvents(result.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this event?")) return;
    await apiClient.delete(`/admin/events/${id}`, true);
    loadEvents();
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          + Create Event
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full rounded-lg bg-white shadow">
          <thead>
            <tr className="border-b text-left text-sm text-main">
              <th className="p-3">Event Name</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Attended</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b">
                <td className="p-3">{event.name}</td>
                <td className="p-3">{formatWib(event.event_datetime)}</td>
                <td className="p-3">
                  {event.is_active ? "Active" : "Inactive"}
                </td>
                <td className="p-3">{event.attended_count}</td>
                <td className="p-3">
                  <div className="action-buttons">
                    <button
                      onClick={() => setViewingAttendeesId(event.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      View Attendees
                    </button>
                    <button
                      onClick={() => setEditingEventId(event.id)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <CreateEventModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadEvents();
          }}
        />
      )}

      {viewingAttendeesId && (
        <EventAttendeesModal
          id={viewingAttendeesId}
          onClose={() => setViewingAttendeesId(null)}
        />
      )}

      {editingEventId && (
        <EditEventModal
          id={editingEventId}
          onClose={() => setEditingEventId(null)}
          onSaved={() => {
            setEditingEventId(null);
            loadEvents();
          }}
        />
      )}
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

  async function handleSubmit(e) {
    e.preventDefault();

    const eventDatetimeIso = fromWibInputValue(form.event_datetime); // or fromWibInputValue(eventDatetime) in Create
    if (!eventDatetimeIso) {
      setError("Please enter a complete, valid date and time.");
      return;
    }

    const result = await apiClient.post(
      "/admin/events",
      {
        name,
        event_datetime: fromWibInputValue(eventDatetime),
        location,
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
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow"
      >
        <h2 className="mb-4 text-lg font-bold">Create Event</h2>

        <input
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />

        <label className="mb-1 block text-sm text-main">
          Event Date & Time
        </label>
        <input
          type="datetime-local"
          value={eventDatetime}
          onChange={(e) => setEventDatetime(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />

        <label className="mb-1 block text-sm text-main">
          Check-in opens (hours before)
        </label>
        <input
          type="number"
          value={openMinutes / 60}
          onChange={(e) => setOpenMinutes(e.target.value * 60)}
          className="mb-3 w-full rounded border px-3 py-2"
        />

        <label className="mb-1 block text-sm text-main">
          Check-in closes (hours after start)
        </label>
        <input
          type="number"
          value={closeMinutes / 60}
          onChange={(e) => setCloseMinutes(e.target.value * 60)}
          className="mb-4 w-full rounded border px-3 py-2"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

function EventAttendeesModal({ id, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient
      .get(`/admin/dashboard/events/${id}/attendance`, true)
      .then((result) => setData(result.data));
  }, [id]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow">
        {!data ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2 className="mb-1 text-lg font-bold">{data.event.name}</h2>
            <p className="mb-4 text-sm text-main">
              {data.attendees.length} attendees
            </p>

            <ul className="space-y-2 text-sm">
              {data.attendees.map((a) => (
                <li
                  key={a.user_id}
                  className="flex justify-between border-b pb-2"
                >
                  <span>
                    {a.full_name}{" "}
                    <span className="text-main">({a.university || "-"})</span>
                  </span>
                  <span className="text-main">
                    {formatWib(a.checked_in_at)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function EditEventModal({ id, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get(`/admin/events/${id}`, true)
      .then((result) => setForm(result.data));
  }, [id]);

  useEffect(() => {
    apiClient.get(`/admin/events/${id}`, true).then((result) => {
      setForm({
        ...result.data,
        event_datetime: toWibInputValue(result.data.event_datetime),
      });
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    const eventDatetimeIso = fromWibInputValue(form.event_datetime); // or fromWibInputValue(eventDatetime) in Create
    if (!eventDatetimeIso) {
      setError("Please enter a complete, valid date and time.");
      return;
    }

    const result = await apiClient.patch(
      `/admin/events/${id}`,
      {
        name: form.name,
        // FIX: Only format the datetime if it's a valid string
        event_datetime: fromWibInputValue(form.event_datetime),
        location: form.location,
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
  }

  if (!form) return null;

  const localDatetime = new Date(form.event_datetime)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow"
      >
        {/* ... rest of your JSX is fine ... */}
        <h2 className="mb-4 text-lg font-bold">Edit Event</h2>

        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          type="datetime-local"
          min="0000-01-01T00:00"
          max="9999-12-31T23:59"
          value={form.event_datetime}
          onChange={(e) => setForm({ ...form, event_datetime: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          value={form.location || ""}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          type="number"
          value={form.checkin_open_minutes / 60}
          onChange={(e) =>
            setForm({ ...form, checkin_open_minutes: e.target.value * 60 })
          }
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          type="number"
          value={form.checkin_close_minutes / 60}
          onChange={(e) =>
            setForm({ ...form, checkin_close_minutes: e.target.value * 60 })
          }
          className="mb-3 w-full rounded border px-3 py-2"
        />

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
