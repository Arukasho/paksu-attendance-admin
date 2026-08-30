export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("admin_user");
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  const result = await response.json();

  if (result.data) {
    saveTokens(result.data.access_token, result.data.refresh_token);
    return true;
  }
  clearTokens();
  return false;
}

export function saveUser(user) {
  localStorage.setItem("admin_user", JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem("admin_user");
  return raw ? JSON.parse(raw) : null;
}
