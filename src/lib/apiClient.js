import { getAccessToken, refreshAccessToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function request(method, path, body, auth = false, isRetry = false) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = getAccessToken();
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && auth && !isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return request(method, path, body, auth, true);
      window.location.href = "/login";
      return { error: true, code: "unauthorized", message: "Session expired." };
    }

    if (response.status === 204) return { data: {} };
    return response.json();
  } catch (err) {
    return {
      error: true,
      code: "network_error",
      message:
        "No internet connection. Please check your connection and try again.",
    };
  }
}

export const apiClient = {
  post: (path, body, auth) => request("POST", path, body, auth),
  get: (path, auth) => request("GET", path, undefined, auth),
  patch: (path, body, auth) => request("PATCH", path, body, auth),
  delete: (path, auth) => request("DELETE", path, undefined, auth),
};
