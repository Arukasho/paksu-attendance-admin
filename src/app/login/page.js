"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { saveTokens } from "@/lib/auth";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await apiClient.post("/auth/login", {
      identifier,
      password,
    });

    setLoading(false);

    if (!result.data) {
      setError(result.message || "Login failed.");
      return;
    }

    if (result.data.user.role !== "admin") {
      setError("This account does not have admin access.");
      return;
    }

    saveTokens(result.data.access_token, result.data.refresh_token);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-xl font-bold">Admin Login</h1>

        <input
          type="text"
          placeholder="Username, Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
