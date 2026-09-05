"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { saveTokens, saveUser, getAccessToken } from "@/lib/auth";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) {
      router.push("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.post("/auth/login", {
        identifier,
        password,
      });

      if (!result.data) {
        setError(result.message || "Login failed.");
        return;
      }

      if (result.data.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }

      saveTokens(result.data.access_token, result.data.refresh_token);

      saveUser(result.data.user);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl">
            <img
              src="splash_icon.png"
              alt="PAKSU Attendance App Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Paksu Attendance
          </h1>

          <p className="mt-1 text-sm text-slate-500">Dashboard Admin</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <h2 className="text-lg font-bold text-slate-900">Haloo!</h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in untuk mengakses dashboard admin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
            <div className="space-y-5">
              {/* Identifier */}
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Username, Email atau Nomor Telepon
                </label>

                <input
                  id="identifier"
                  type="text"
                  placeholder="Masukkan your username, email atau nomor telepon"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  <span className="mt-0.5">!</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          @2026 PAKSU Attendance App. All rights reserved.
        </p>
      </div>
    </div>
  );
}
