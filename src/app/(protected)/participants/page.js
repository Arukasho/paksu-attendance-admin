"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { exportToCsv } from "@/lib/csvExport";
import { getUser } from "@/lib/auth";

const PARTICIPANT_EXPORT_COLUMNS = [
  { label: "Nama Lengkap", key: "full_name" },
  { label: "Username", key: "username" },
  { label: "Phone", key: "phone" },
  { label: "Email", key: "email" },
  { label: "Asal Universitas", key: "university" },
  { label: "Stambuk", key: "stambuk" },
  { label: "Alamat Domisili", key: "domicile_address" },
  { label: "Tempat Lahir", key: "birth_place" },
  { label: "Tanggal Lahir", key: "birth_date" },
  { label: "Sudah Punya KTB", key: "ktb_has" },
  { label: "Ingin Bergabung KTB", key: "want_join_ktb" },
  { label: "Melayani Sebagai", key: "serve_as" },
  { label: "Melayani Sebagai (Lainnya)", key: "serve_as_other" },
  { label: "Status Pernikahan", key: "marriage_status" },
  { label: "Event yang Diikuti", key: "events_attended" },
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
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                <p className="text-sm text-slate-500">
                  Loading participants...
                </p>
              </div>
            ) : participants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                  👤
                </div>
                <h2 className="font-semibold text-slate-900">
                  {search.trim()
                    ? "No participants found"
                    : "No participants yet"}
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Participant
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Phone
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          University
                        </th>
                        <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Events
                        </th>
                        <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Role
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <ParticipantTableRow
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
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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

function ParticipantTableRow({
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
    <tr
      className={`transition hover:bg-slate-50 ${!isLast ? "border-b border-slate-200" : ""}`}
    >
      {/* Participant */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
            {getInitials(participant.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {participant.full_name || "-"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              @{participant.username || "-"}
            </p>
            {participant.email && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {participant.email}
              </p>
            )}
          </div>
        </div>
      </td>
      {/* Phone */}
      <td className="px-4 py-4">
        <span className="text-sm text-slate-600">
          {participant.phone || "-"}
        </span>
      </td>
      {/* University */}
      <td className="max-w-[220px] px-4 py-4">
        <span className="block truncate text-sm text-slate-600">
          {participant.university || "-"}
        </span>
      </td>
      {/* Events */}
      <td className="px-4 py-4 text-center">
        <span className="font-semibold text-slate-800">{eventCount}</span>
        <span className="ml-1 text-xs text-slate-400">
          {eventCount === 1 ? "event" : "events"}
        </span>
      </td>
      {/* Role */}
      <td className="px-4 py-4 text-center">
        {isAdmin ? (
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Admin
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Attendee
          </span>
        )}
      </td>
      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            View
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Edit
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={onToggleAdmin}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {isAdmin ? "Revoke Admin" : "Make Admin"}
            </button>
          )}
          {!isSelf && !isAdmin && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
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

          <p className="text-xs text-slate-400">
            KTB, marriage status, and service role can be set after the
            participant is created, via Edit.
          </p>

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

// Generic select field for constrained-value fields (booleans stored as
// tri-state "", "true", "false", or a fixed set of string options).
function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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

function selectToBool(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function boolToSelectValue(value) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
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

      const payload = {
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        university: form.university?.trim() || "",
        serve_as: form.serve_as?.trim() || "",
        serve_as_more: form.serve_as_more?.trim() || "",
        ktb_has: form.ktb_has,
        want_join_ktb: form.want_join_ktb,
      };

      if (form.marriage_status) {
        payload.marriage_status = form.marriage_status;
      }

      const result = await apiClient.patch(
        `/admin/participants/${id}`,
        payload,
        true,
      );

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
        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
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

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              KTB &amp; Ministry
            </p>

            <div className="space-y-4">
              <SelectField
                label="Sudah Punya KTB"
                value={boolToSelectValue(form.ktb_has)}
                onChange={(value) =>
                  setForm({
                    ...form,
                    ktb_has: selectToBool(value),
                  })
                }
                options={[
                  { value: "", label: "Not set" },
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />

              <SelectField
                label="Ingin Bergabung KTB"
                value={boolToSelectValue(form.want_join_ktb)}
                onChange={(value) =>
                  setForm({
                    ...form,
                    want_join_ktb: selectToBool(value),
                  })
                }
                options={[
                  { value: "", label: "Not set" },
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />

              <FormField
                label="Melayani Sebagai"
                value={form.serve_as || ""}
                onChange={(value) => setForm({ ...form, serve_as: value })}
                placeholder="e.g. Worship, Usher, Multimedia"
              />

              <FormField
                label="Melayani Sebagai (Lainnya)"
                value={form.serve_as_more || ""}
                onChange={(value) => setForm({ ...form, serve_as_more: value })}
                placeholder="e.g. Koordinator, Dokumentasi"
              />

              <SelectField
                label="Status Pernikahan"
                value={form.marriage_status || ""}
                onChange={(value) =>
                  setForm({ ...form, marriage_status: value })
                }
                options={[
                  { value: "", label: "Not set" },
                  { value: "single", label: "Single" },
                  { value: "married", label: "Married" },
                ]}
              />
            </div>
          </div>

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

        {/* KTB & Ministry */}
        <div className="px-6 py-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            KTB &amp; Ministry
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              label="Sudah Punya KTB"
              value={formatBool(data.ktb_has)}
            />

            <InfoItem
              label="Ingin Bergabung KTB"
              value={formatBool(data.want_join_ktb)}
            />

            <InfoItem
              label="Melayani Sebagai"
              value={[data.serve_as, data.serve_as_more]
                .filter(Boolean)
                .join(", ")}
            />

            <InfoItem
              label="Status Pernikahan"
              value={formatMarriageStatus(data.marriage_status)}
            />
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

function formatBool(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return null;
}

function formatMarriageStatus(value) {
  if (value === "single") return "Single";
  if (value === "married") return "Married";
  return null;
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
