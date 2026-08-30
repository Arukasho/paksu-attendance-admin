"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { formatWib } from "@/lib/dateUtils";

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  async function load() {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const result = await apiClient.get(`/admin/participants${query}`, true);
    setParticipants(result.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this participant?")) return;
    await apiClient.delete(`/admin/participants/${id}`, true);
    load();
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Participants</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          + Add Participant
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <input
            placeholder="Search participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <button type="submit" className="rounded bg-gray-200 px-4 py-2">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full rounded-lg bg-white shadow">
          <thead>
            <tr className="border-b text-left text-sm text-main">
              <th className="p-3">Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Phone</th>
              <th className="p-3">University</th>
              <th className="p-3">Events Attended</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.full_name}</td>
                <td className="p-3">{p.username}</td>
                <td className="p-3">{p.phone}</td>
                <td className="p-3">{p.university || "-"}</td>
                <td className="p-3">{p.events_attended}</td>
                <td className="p-3">
                  <div className="action-buttons">
                    <button
                      onClick={() => setViewingId(p.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
      {showAddForm && (
        <AddParticipantModal
          onClose={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false);
            load();
          }}
        />
      )}
      {editingId && (
        <EditParticipantModal
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            load();
          }}
        />
      )}
      {viewingId && (
        <ViewParticipantModal
          id={viewingId}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}

function AddParticipantModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await apiClient.post(
      "/admin/participants",
      {
        full_name: fullName,
        username,
        phone,
        email,
        password,
      },
      true,
    );

    if (!result.data) {
      setError(result.message || "Failed to create participant.");
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
        <h2 className="mb-4 text-lg font-bold">Add Participant</h2>

        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

function EditParticipantModal({ id, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get(`/admin/participants/${id}`, true)
      .then((result) => setForm(result.data));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await apiClient.patch(
      `/admin/participants/${id}`,
      {
        full_name: form.full_name,
        username: form.username,
        phone: form.phone,
        email: form.email,
        university: form.university,
      },
      true,
    );

    if (!result.data) {
      setError(result.message || "Failed to update participant.");
      return;
    }
    onSaved();
  }

  if (!form) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow"
      >
        <h2 className="mb-4 text-lg font-bold">Edit Participant</h2>

        <input
          value={form.full_name || ""}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          value={form.username || ""}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          value={form.phone || ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          value={form.email || ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mb-3 w-full rounded border px-3 py-2"
        />
        <input
          placeholder="University"
          value={form.university || ""}
          onChange={(e) => setForm({ ...form, university: e.target.value })}
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
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function ViewParticipantModal({ id, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient
      .get(`/admin/participants/${id}`, true)
      .then((result) => setData(result.data));
  }, [id]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-bold">Participant Details</h2>

        {!data ? (
          <p>Loading...</p>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {data.full_name}
            </p>
            <p>
              <strong>Username:</strong> {data.username}
            </p>
            <p>
              <strong>Phone:</strong> {data.phone}
            </p>
            <p>
              <strong>Email:</strong> {data.email || "-"}
            </p>
            <p>
              <strong>University:</strong> {data.university || "-"}
            </p>

            <h3 className="mb-2 mt-4 font-semibold">Event Attendance</h3>
            <ul className="text-sm space-y-1">
              {data.events?.map((ev) => (
                <li key={ev.event_id} className="flex justify-between">
                  <span>{ev.event_name}</span>
                  {ev.attended ? (
                    <span className="text-green-600">✓ Attended</span>
                  ) : (
                    <span className="text-main">Not attended</span>
                  )}
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
