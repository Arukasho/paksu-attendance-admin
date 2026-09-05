"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { exportToCsv } from "@/lib/csvExport";
import { getUser } from "@/lib/auth";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/apiClient";

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
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const [filters, setFilters] = useState({
    name: "",
    stambuk: "",
    ktb_has: "",
    want_join_ktb: "",
    marriage_status: "",
  });

  const currentUser = getUser();

  const query = submittedSearch.trim()
    ? `?search=${encodeURIComponent(submittedSearch.trim())}`
    : "";
  const swrKey = `/admin/participants${query}`;
  const { data: result, isLoading } = useSWR(swrKey, fetcher);

  const offline = result?.code === "network_error";
  const error = offline
    ? "You're offline. Check your internet connection and try again."
    : result && !result.data
      ? "Failed to load participants."
      : null;
  const participants = result?.data || [];

  async function handleSearch(e) {
    e.preventDefault();
    setSubmittedSearch(search);
  }

  const filteredParticipants = participants.filter((participant) => {
    const name = (participant.full_name || "").toLowerCase();
    const stambuk = (participant.stambuk || "").toLowerCase();

    // Text filters
    if (
      filters.name.trim() &&
      !name.includes(filters.name.trim().toLowerCase())
    ) {
      return false;
    }

    if (
      filters.stambuk.trim() &&
      !stambuk.includes(filters.stambuk.trim().toLowerCase())
    ) {
      return false;
    }

    // KTB filter
    if (filters.ktb_has === "true" && participant.ktb_has !== true) {
      return false;
    }

    if (filters.ktb_has === "false" && participant.ktb_has !== false) {
      return false;
    }

    if (
      filters.ktb_has === "null" &&
      participant.ktb_has !== null &&
      participant.ktb_has !== undefined
    ) {
      return false;
    }

    // Want Join KTB filter
    if (
      filters.want_join_ktb === "true" &&
      participant.want_join_ktb !== true
    ) {
      return false;
    }

    if (
      filters.want_join_ktb === "false" &&
      participant.want_join_ktb !== false
    ) {
      return false;
    }

    if (
      filters.want_join_ktb === "null" &&
      participant.want_join_ktb !== null &&
      participant.want_join_ktb !== undefined
    ) {
      return false;
    }

    // Marriage status
    if (
      filters.marriage_status === "single" &&
      participant.marriage_status !== "single"
    ) {
      return false;
    }

    if (
      filters.marriage_status === "married" &&
      participant.marriage_status !== "married"
    ) {
      return false;
    }

    if (
      filters.marriage_status === "null" &&
      participant.marriage_status !== null &&
      participant.marriage_status !== undefined
    ) {
      return false;
    }

    return true;
  });

  function handleSearchChange(value) {
    setSearch(value);
    if (!value.trim()) {
      setSubmittedSearch("");
    }
  }

  const [actionError, setActionError] = useState(null);

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this participant?",
    );
    if (!confirmed) return;

    try {
      setActionError(null);
      await apiClient.delete(`/admin/participants/${id}`, true);
      await mutate(swrKey);
    } catch (err) {
      console.error(err);
      setActionError("Failed to delete participant.");
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
      setActionError(result.message || "Failed to update role.");
      return;
    }
    await mutate(swrKey);
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
            <h1 className="text-2xl font-bold text-slate-900">
              Database Anggota
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola Database Anggota
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Tambah Anggota
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Cari Anggota..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cari
          </button>
        </form>

        {/* Filters */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Filter Pencarian
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Gunakan beberapa filter untuk mempersempit daftar.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFilters({
                  name: "",
                  stambuk: "",
                  ktb_has: "",
                  want_join_ktb: "",
                  marriage_status: "",
                })
              }
              className="text-xs font-medium text-slate-500 transition hover:text-blue-600"
            >
              Bersihkan filter
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Name */}
            <FilterInput
              label="Name"
              placeholder="Cari nama..."
              value={filters.name}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  name: value,
                }))
              }
            />

            {/* Stambuk */}
            <FilterInput
              label="Stambuk"
              placeholder="Cari stambuk..."
              value={filters.stambuk}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  stambuk: value,
                }))
              }
            />

            {/* KTB */}
            <FilterSelect
              label="Sudah KTB"
              value={filters.ktb_has}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  ktb_has: value,
                }))
              }
              options={[
                { value: "", label: "Semua" },
                { value: "true", label: "Sudah" },
                { value: "false", label: "Belum" },
                { value: "null", label: "Tidak Diisi" },
              ]}
            />

            {/* Want Join KTB */}
            <FilterSelect
              label="Ingin Bergabung dengan KTB"
              value={filters.want_join_ktb}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  want_join_ktb: value,
                }))
              }
              options={[
                { value: "", label: "Semua" },
                { value: "true", label: "Bersedia" },
                { value: "false", label: "Tidak Bersedia" },
                { value: "null", label: "Tidak Diisi" },
              ]}
            />

            {/* Marriage Status */}
            <FilterSelect
              label="Status"
              value={filters.marriage_status}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  marriage_status: value,
                }))
              }
              options={[
                { value: "", label: "Semua" },
                { value: "single", label: "Single" },
                { value: "married", label: "Menikah" },
                { value: "null", label: "Tidak Diisi" },
              ]}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-sm text-slate-500">Memuat Anggota...</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="font-semibold text-slate-900">Tidak Ada Anggota</h2>

            <p className="mt-1 text-sm text-slate-500">
              Belum ada anggota dalam database.
            </p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              🔍
            </div>

            <h2 className="font-semibold text-slate-900">
              Tidak Ada Anggota yang Cocok
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Coba sesuaikan atau hapus filter Anda.
            </p>

            <button
              type="button"
              onClick={() =>
                setFilters({
                  name: "",
                  stambuk: "",
                  ktb_has: "",
                  want_join_ktb: "",
                  marriage_status: "",
                })
              }
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Hapus Filter
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] table-fixed text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-[360px] px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Anggota
                    </th>

                    <th className="w-[90px] whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sudah KTB
                    </th>

                    <th className="w-[110px] whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ingin KTB
                    </th>

                    <th className="w-[130px] whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Pelayanan
                    </th>

                    <th className="w-[100px] whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kehadiran
                    </th>

                    <th className="w-[100px] whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="w-[100px] whitespace-nowrap border-l border-slate-200 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParticipants.map((participant, index) => (
                    <ParticipantTableRow
                      key={participant.id}
                      participant={participant}
                      isLast={index === filteredParticipants.length - 1}
                      onView={() => setViewingId(participant.id)}
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
        <AddParticipantModal
          onClose={() => setShowAddForm(false)}
          onCreated={async () => {
            setShowAddForm(false);
            await mutate(swrKey);
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
            await mutate(swrKey);
          }}
        />
      )}

      {/* View */}
      {viewingId && (
        <ViewParticipantModal
          id={viewingId}
          onClose={() => setViewingId(null)}
          currentUserId={currentUser?.id}
          onEdit={() => {
            setViewingId(null);
            setEditingId(viewingId);
          }}
          onDelete={async () => {
            await handleDelete(viewingId);
            setViewingId(null);
          }}
          onToggleAdmin={async (participant) => {
            await handleToggleAdmin(participant);
            setViewingId(null);
          }}
        />
      )}
    </div>
  );
}

function ParticipantTableRow({ participant, isLast, onView }) {
  const eventCount = participant.events_attended ?? 0;
  const isAdmin = participant.role === "admin";

  const ktbLabel =
    participant.ktb_has === true
      ? "Sudah"
      : participant.ktb_has === false
        ? "Belum"
        : "-";

  const joinKtbLabel =
    participant.want_join_ktb === true
      ? "Bersedia"
      : participant.want_join_ktb === false
        ? "Tidak"
        : "-";

  const serveAsLabel = Array.isArray(participant.serve_as)
    ? participant.serve_as
        .map((item) =>
          item === "Lainnya" && participant.serve_as_other
            ? participant.serve_as_other
            : item,
        )
        .join(", ")
    : "-";

  return (
    <tr
      className={`transition-colors hover:bg-slate-50 ${
        !isLast ? "border-b border-slate-200" : ""
      }`}
    >
      {/* Participant */}
      <td className="px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
            {getInitials(participant.full_name)}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-900">
                {participant.full_name || "-"}
              </p>

              <span className="shrink-0 text-xs text-slate-400">
                ({getUniversityInitials(participant.university || "-")} -{" "}
                {participant.stambuk || "-"})
              </span>
            </div>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              @{participant.username || "-"}
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-400">
              {participant.email && (
                <>
                  <span className="truncate">{participant.email}</span>
                  <span className="shrink-0 text-slate-300">•</span>
                </>
              )}

              <span className="truncate">{participant.phone || "-"}</span>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-400">
              {`Status: ${
                participant.marriage_status === "single"
                  ? "Single"
                  : participant.marriage_status === "married"
                    ? "Menikah"
                    : "-"
              }`}
            </div>
          </div>
        </div>
      </td>

      {/* KTB */}
      <td className="whitespace-nowrap px-5 py-4 text-center">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            participant.ktb_has === true
              ? "bg-green-50 text-green-700"
              : participant.ktb_has === false
                ? "bg-slate-100 text-slate-500"
                : "bg-slate-50 text-slate-400"
          }`}
        >
          {ktbLabel}
        </span>
      </td>

      {/* Join KTB */}
      <td className="whitespace-nowrap px-5 py-4 text-center">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            participant.want_join_ktb === true
              ? "bg-green-50 text-green-700"
              : participant.want_join_ktb === false
                ? "bg-slate-100 text-slate-500"
                : "bg-slate-50 text-slate-400"
          }`}
        >
          {joinKtbLabel}
        </span>
      </td>

      {/* Serve As */}
      <td className="whitespace-wrap px-5 py-4 text-center">
        <div className="flex flex-wrap justify-center gap-1.5">
          {serveAsLabel
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean)
            .map((role) => (
              <span
                key={role}
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  role === "Pemusik"
                    ? "bg-blue-100 text-blue-700"
                    : role === "Singer"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {role}
              </span>
            ))}
        </div>
      </td>

      {/* Events */}
      <td className="whitespace-nowrap px-5 py-4 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-sm font-semibold text-slate-800">
            {eventCount}
          </span>

          <span className="text-xs text-slate-400">
            {eventCount === 1 ? "event" : "events"}
          </span>
        </div>
      </td>

      {/* Role */}
      <td className="whitespace-nowrap px-5 py-4 text-center">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            isAdmin
              ? "bg-blue-50 font-semibold text-blue-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isAdmin ? "Admin" : "Attendee"}
        </span>
      </td>

      {/* Actions */}
      <td className="border-l border-slate-100 px-6 py-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            View
          </button>
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

function getUniversityInitials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
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
      title="Tambah Anggota Baru"
      description="Buat akun anggota baru."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <FormField
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Masukkan Nama Lengkap"
            required
          />

          <FormField
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="Masukkan Username"
            required
          />

          <FormField
            label="Nomor Telepon"
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
            placeholder="e.g. person@example.com"
            type="email"
            required
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
            Sudah KTB, status pernikahan, dan peran layanan dapat diatur setelah
            anggota dibuat, melalui Edit.
          </p>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <ModalFooter
          onClose={onClose}
          submitText="Buat Anggota"
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

function FilterInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
        {hideSubmit ? "Tutup" : "Batal"}
      </button>

      {!hideSubmit && (
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : submitText}
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
        serve_as_other: form.serve_as_other?.trim() || "",
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
              Memuat anggota...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal
      title="Edit Anggota"
      description="Update data anggota."
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
            required
          />

          <FormField
            label="Asal Sekolah / Universitas"
            value={form.university || ""}
            onChange={(value) => setForm({ ...form, university: value })}
            placeholder="Asal Sekolah / Universitas"
          />

          <div className="border-t border-slate-100 pt-4">
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
          submitText="Simpan Perubahan"
          loading={saving}
        />
      </form>
    </Modal>
  );
}

function ViewParticipantModal({
  id,
  onClose,
  currentUserId,
  onEdit,
  onDelete,
  onToggleAdmin,
}) {
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
              Memuat anggota...
            </div>
          )}
        </div>
      </div>
    );
  }

  const eventCount = data.events?.filter((event) => event.attended).length ?? 0;
  const isSelf = data.id === currentUserId;
  const isAdmin = data.role === "admin";

  return (
    <Modal
      title="Detail Anggota"
      description="Lihat informasi anggota dan kehadiran acara."
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
            Informasi Kontak
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
              label="Ingin Melayani Sebagai"
              value={
                Array.isArray(data.serve_as)
                  ? data.serve_as
                      .map((item) =>
                        item === "Lainnya" && data.serve_as_other
                          ? data.serve_as_other
                          : item,
                      )
                      .join(", ")
                  : "-"
              }
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
              Kehadiran Event
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
                      ✓ Hadir
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Tidak Hadir
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm text-slate-500">
                Tidak ada data kehadiran event untuk anggota ini.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
        <div className="flex flex-wrap gap-2">
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
              onClick={() => onToggleAdmin(data)}
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
              Hapus
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Tutup
        </button>
      </div>
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
