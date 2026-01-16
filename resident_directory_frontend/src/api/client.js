const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

const TOKEN_KEY = "rms_token";
const ROLE_KEY = "rms_role";
const EMAIL_KEY = "rms_email";

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Return API base URL used by the frontend. */
  return API_BASE_URL;
}

// PUBLIC_INTERFACE
export function getAuth() {
  /** Get persisted auth info from localStorage. */
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  const email = localStorage.getItem(EMAIL_KEY);
  if (!token || !role || !email) return null;
  return { token, role, email };
}

// PUBLIC_INTERFACE
export function setAuth({ token, role, email }) {
  /** Persist auth info to localStorage. */
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(EMAIL_KEY, email);
}

// PUBLIC_INTERFACE
export function clearAuth() {
  /** Clear auth info from localStorage. */
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

async function request(path, { method = "GET", token, headers, body } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const mergedHeaders = {
    ...(headers || {}),
  };

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: mergedHeaders,
    body,
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson && data && data.detail ? data.detail : "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// PUBLIC_INTERFACE
export async function login(email, password) {
  /** Login and return token response. */
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

// PUBLIC_INTERFACE
export async function fetchMe(token) {
  /** Fetch current user info. */
  return request("/auth/me", { token });
}

// PUBLIC_INTERFACE
export async function listResidents({ q, page, pageSize }) {
  /** Public list/search residents. */
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("page_size", String(pageSize));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request(`/residents${qs}`);
}

// PUBLIC_INTERFACE
export async function getResident(id) {
  /** Public get resident by id. */
  return request(`/residents/${id}`);
}

// PUBLIC_INTERFACE
export async function createResident(token, payload) {
  /** Admin create resident. */
  return request("/residents", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateResident(token, id, payload) {
  /** Admin update resident. */
  return request(`/residents/${id}`, {
    method: "PUT",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteResident(token, id) {
  /** Admin delete resident. */
  return request(`/residents/${id}`, {
    method: "DELETE",
    token,
  });
}

// PUBLIC_INTERFACE
export async function uploadPhoto(token, file) {
  /** Admin upload photo file. Returns {photo_url}. */
  const form = new FormData();
  form.append("file", file);
  return request("/uploads/photo", {
    method: "POST",
    token,
    body: form,
  });
}
