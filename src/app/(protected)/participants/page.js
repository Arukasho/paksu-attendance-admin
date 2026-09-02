"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { exportToCsv } from "@/lib/csvExport";
import { getUser } from "@/lib/auth";

const PARTICIPANT_EXPORT_COLUMNS = [
  { label: "Full Name", key: "full_name" },
  { label: "Username", key: "username" },
  { label: "Phone", key: "phone" },
  { label: "Email", key: "email" },
  { label: "University", key: "university" },
  { label: "Stambuk", key: "stambuk" },
  { label: "Domicile Address", key: "domicile_address" },
  { label: "Birth Place", key: "birth_place" },
  { label: "Birth Date", key: "birth_date" },
  { label: "Events Attended", key: "events_attended" },
];

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const currentUser = getUser();

  async function loadParticipants(searchValue = search) {
    try {
      setLoading(true);
      setError(null);

      const query = searchValue.trim()
        ? `?search=${encodeURIComponent(searchValue.trim())}`
        : "";

      const result = await apiClient.get(`/admin/participants${query}`, true);

      if (result.code === "network_error") {
        setError(
          "You're offline. Check your internet connection and try again.",
        );
        setParticipants([]);
        return;
      }

      setParticipants(result.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load participants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParticipants("");
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    await loadParticipants(search);
  }

  async function handleSearchChange(value) {
    setSearch(value);

    if (!value.trim()) {
      await loadParticipants("");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this participant?",
    );

    if (!confirmed) return;

    try {
      setError(null);

      await apiClient.delete(`/admin/participants/${id}`, true);
      await loadParticipants();
    } catch (err) {
      console.error(err);
      setError("Failed to delete participant.");
    }
  }

  async function handleToggleAdmin(participant) {
    const newRole = participant.role === "admin" ? "attendee" : "admin";
    const confirmed = window.confirm(
      newRole === "admin"
        ? `Grant admin access to ${participant.full_name}?`
        : `Revoke admin access from ${participant.full_name}?`,
    );
    if (!confirmed) return;

    const result = await apiClient.patch(
      `/admin/participants/${participant.id}/role`,
      { role: newRole },
      true,
    );
    if (!result.data) {
      setError(result.message || "Failed to update role.");
      return;
    }
    await loadParticipants();
  }

  async function handleExport() {
    const result = await apiClient.get("/admin/participants", true);
    if (result.code === "network_error" || !result.data) return;
    exportToCsv("participants.csv", PARTICIPANT_EXPORT_COLUMNS, result.data);
  }

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Participants</h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage registered participants.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            + Add Participant
          </button>

          <button
            onClick={handleExport}
            className="w-full shrink-0 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto"
          >
            Export CSV
          </button>
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

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Search participants..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Search
          </button>
        </form>

        {/* Content */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">Loading participants...</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              👤
            </div>

            <h2 className="font-semibold text-slate-900">
              {search.trim() ? "No participants found" : "No participants yet"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search.trim()
                ? "Try a different search term."
                : "Add your first participant to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Participant
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {participants.map((participant, index) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isLast={index === participants.length - 1}
                currentUserId={currentUser?.id}
                onView={() => setViewingId(participant.id)}
                onEdit={() => setEditingId(participant.id)}
                onDelete={() => handleDelete(participant.id)}
                onToggleAdmin={() => handleToggleAdmin(participant)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add */}
      {showAddForm && (
        <AddParticipantModal
          onClose={() => setShowAddForm(false)}
          onCreated={async () => {
            setShowAddForm(false);
            await loadParticipants();
          }}
        />
      )}

      {/* Edit */}
      {editingId && (
        <EditParticipantModal
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={async () => {
            setEditingId(null);
            await loadParticipants();
          }}
        />
      )}

      {/* View */}
      {viewingId && (
        <ViewParticipantModal
          id={viewingId}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}

function ParticipantRow({
  participant,
  isLast,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onToggleAdmin,
}) {
  const eventCount = participant.events_attended ?? 0;
  const isSelf = participant.id === currentUserId;
  const isAdmin = participant.role === "admin";

  return (
    <div
      className={`p-5 transition hover:bg-slate-50 md:px-6 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Identity */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
            {getInitials(participant.full_name)}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {participant.full_name || "-"}
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              @{participant.username || "-"}
            </p>

            <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-400">
              {participant.university && <span>{participant.university}</span>}

              {participant.phone && participant.university && <span>•</span>}

              {participant.phone && <span>{participant.phone}</span>}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className="mr-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{eventCount}</span>{" "}
            {eventCount === 1 ? "event" : "events"}
          </div>

          <div className="hidden h-5 w-px bg-slate-200 lg:block" />

          <button
            type="button"
            onClick={onView}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            View
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </button>

          {!isSelf && (
            <button
              type="button"
              onClick={onToggleAdmin}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {isAdmin ? "Revoke Admin" : "Make Admin"}
            </button>
          )}

          {!isSelf && !isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
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

function Modal({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
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

function AddParticipantModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const result = await apiClient.post(
        "/admin/participants",
        {
          full_name: fullName.trim(),
          username: username.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        },
        true,
      );

      if (result.code === "network_error") {
        setError(
          "You're offline. Check your internet connection and try again.",
        );
        return;
      }

      if (!result.data) {
        setError(result.message || "Failed to create participant.");
        return;
      }

      onCreated();
    } catch (err) {
      console.error(err);
      setError("Failed to create participant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add Participant"
      description="Create a new participant account."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <FormField
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="e.g. Alwi Okta Jeremy"
            required
          />

          <FormField
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="e.g. alwi"
            required
          />

          <FormField
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="e.g. 08123456789"
            type="tel"
            required
          />

          <FormField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="e.g. alwi@example.com"
            type="email"
          />

          <FormField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
            type="password"
            required
          />

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <ModalFooter
          onClose={onClose}
          submitText="Create Participant"
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
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
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

function EditParticipantModal({ id, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadParticipant() {
      try {
        setError(null);

        const result = await apiClient.get(`/admin/participants/${id}`, true);

        if (result.code === "network_error") {
          if (mounted)
            setError(
              "You're offline. Check your internet connection and try again.",
            );
          return;
        }

        if (mounted) {
          setForm(result.data);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Failed to load participant.");
        }
      }
    }

    loadParticipant();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const result = await apiClient.patch(
        `/admin/participants/${id}`,
        {
          full_name: form.full_name.trim(),
          username: form.username.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          university: form.university?.trim() || "",
        },
        true,
      );

      if (result.code === "network_error") {
        setError(
          "You're offline. Check your internet connection and try again.",
        );
        return;
      }

      if (result.code === "network_error") {
        setError(
          "You're offline. Check your internet connection and try again.",
        );
        return;
      }

      if (!result.data) {
        setError(result.message || "Failed to update participant.");
        return;
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setError("Failed to update participant.");
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
              Loading participant...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal
      title="Edit Participant"
      description="Update the participant's information."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <FormField
            label="Full Name"
            value={form.full_name || ""}
            onChange={(value) => setForm({ ...form, full_name: value })}
            placeholder="Full name"
            required
          />

          <FormField
            label="Username"
            value={form.username || ""}
            onChange={(value) => setForm({ ...form, username: value })}
            placeholder="Username"
            required
          />

          <FormField
            label="Phone"
            value={form.phone || ""}
            onChange={(value) => setForm({ ...form, phone: value })}
            placeholder="Phone number"
            type="tel"
            required
          />

          <FormField
            label="Email"
            value={form.email || ""}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="Email address"
            type="email"
          />

          <FormField
            label="University"
            value={form.university || ""}
            onChange={(value) => setForm({ ...form, university: value })}
            placeholder="University"
          />

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

function ViewParticipantModal({ id, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadParticipant() {
      try {
        setError(null);

        const result = await apiClient.get(`/admin/participants/${id}`, true);

        if (result.code === "network_error") {
          if (mounted)
            setError(
              "You're offline. Check your internet connection and try again.",
            );
          return;
        }

        if (mounted) {
          setData(result.data);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Failed to load participant.");
        }
      }
    }

    loadParticipant();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
        <div className="rounded-xl bg-white px-8 py-6 shadow-xl">
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              Loading participant...
            </div>
          )}
        </div>
      </div>
    );
  }

  const eventCount = data.events?.filter((event) => event.attended).length ?? 0;

  return (
    <Modal
      title="Participant Details"
      description="View participant information and event attendance."
      onClose={onClose}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Profile */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-700">
              {getInitials(data.full_name)}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900">
                {data.full_name || "-"}
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">
                @{data.username || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Information */}
        <div className="px-6 py-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Contact Information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Phone" value={data.phone} />

            <InfoItem label="Email" value={data.email} />

            <InfoItem label="University" value={data.university} />
          </div>
        </div>

        <div className="border-t border-slate-200" />

        {/* Attendance */}
        <div className="px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Event Attendance
            </h3>

            <span className="text-sm font-semibold text-slate-700">
              {eventCount} {eventCount === 1 ? "event" : "events"}
            </span>
          </div>

          {data.events?.length ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {data.events.map((event, index) => (
                <div
                  key={event.event_id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    index !== data.events.length - 1
                      ? "border-b border-slate-200"
                      : ""
                  }`}
                >
                  <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {event.event_name}
                  </span>

                  {event.attended ? (
                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      ✓ Attended
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Not attended
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm text-slate-500">
                No event attendance records.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalFooter onClose={onClose} submitText="Close" hideSubmit />
    </Modal>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>

      <p className="break-words text-sm font-medium text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}
