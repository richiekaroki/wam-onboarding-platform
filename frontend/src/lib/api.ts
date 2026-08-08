// frontend/src/lib/api.ts
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";





// ── Cookie helpers (cookies survive SSR; localStorage does not) ────────────
const COOKIE_REGEX_CACHE = new Map<string, RegExp>();
function getCookiePattern(name: string): RegExp {
  let re = COOKIE_REGEX_CACHE.get(name);
  if (!re) {
    re = new RegExp(`(?:^|; )${name}=([^;]*)`);
    COOKIE_REGEX_CACHE.set(name, re);
  }
  return re;
}
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(getCookiePattern(name));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${secure}`;
}

function deleteCookie(name: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict${secure}`;
}

// ── Token refresh ──────────────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Deduplicate concurrent refresh attempts
  if (_isRefreshing && _refreshPromise) return _refreshPromise;

  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      // Refresh token is HttpOnly cookie — backend reads it automatically
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh/`,
        {},
        { headers: { "Content-Type": "application/json" } }
      );
      const { access } = response.data;
      setCookie("access_token", access, 1);
      return access;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── Axios interceptors ─────────────────────────────────────────────────────
function setupInterceptors(instance: any) {
  if (instance?.interceptors) {
    instance.interceptors.request.use((config: { headers: { Authorization: string; }; }) => {
      const token = getCookie("access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response: any) => response,
      async (error: { config?: any; response?: { status: number; data?: unknown }; message?: string }) => {
        const originalRequest = error.config;

        // Attempt token refresh on 401 (skip if this is the refresh call itself or already retried)
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/auth/refresh/") &&
          !originalRequest.url?.includes("/auth/magic-link/") &&
          !originalRequest.url?.includes("/auth/verify-magic-link/")
        ) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch {
            // Refresh failed — clear tokens and redirect to login
          }
        }

        if (error.response?.status === 401) {
          deleteCookie("access_token");
          _currentUser = null;
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }
}

// ── Error message extraction ───────────────────────────────────────────────
// (extractErrorMessage removed — inline error handling used in components instead)

let _apiInstance: any = null;

function getApiInstance() {
  if (!_apiInstance) {
    _apiInstance = (axios as any).create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });
    setupInterceptors(_apiInstance);
  }
  return _apiInstance;
}

// ── Auth state (in-memory; rehydrated on page load via loadCurrentUser) ─────
export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "client";
  is_staff: boolean;
}

let _currentUser: AuthUser | null = null;

export function getCurrentUser(): AuthUser | null {
  return _currentUser;
}

export function isAuthenticated(): boolean {
  return !!getCookie("access_token");
}

export function isAdmin(): boolean {
  return (
    !!_currentUser && (_currentUser.is_staff || _currentUser.role === "admin")
  );
}

// ── Auth API ───────────────────────────────────────────────────────────────
export async function requestMagicLink(email: string, firstName = "", lastName = ""): Promise<void> {
  // Store name in localStorage so we can apply it after verification
  if (firstName || lastName) {
    localStorage.setItem("pending_profile", JSON.stringify({ first_name: firstName, last_name: lastName }));
  }
  await getApiInstance().post("/auth/magic-link/", { email });
}

export async function verifyMagicLink(token: string): Promise<AuthUser> {
  const response = await getApiInstance().get(
    `/auth/verify-magic-link/?token=${encodeURIComponent(token)}`
  );
  const { access, user } = response.data;
  setCookie("access_token", access, 1);
  _currentUser = user;
  return user;
}

export async function loadCurrentUser(): Promise<AuthUser | null> {
  if (!isAuthenticated()) return null;
  try {
    const response = await getApiInstance().get("/auth/me/");
    _currentUser = response.data;
    return _currentUser;
  } catch {
    return null;
  }
}

export async function updateProfile(data: { first_name: string; last_name: string }): Promise<AuthUser> {
  const response = await getApiInstance().patch("/auth/me/", data);
  _currentUser = response.data;
  return response.data;
}

export async function logout(): Promise<void> {
  // Call backend to blacklist refresh token (best-effort, don't block logout)
  try {
    await getApiInstance().post("/auth/logout/");
  } catch {
    // Ignore errors — clear cookies anyway
  }
  deleteCookie("access_token");
  _currentUser = null;
  // Use hard redirect to ensure full page reset and clear all in-memory state
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ── Forms ──────────────────────────────────────────────────────────────────

export async function getForms(page = 1): Promise<any[]> {
  const response = await getApiInstance().get(`/forms/?page=${page}`);
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.results) return data.results;
  return [];
}

export async function getForm(slug: string) {
  const response = await getApiInstance().get(`/forms/${slug}/`);
  return response.data;
}

export async function createForm(formData: {
  name: string;
  slug: string;
  description?: string;
  schema: object;
  is_active?: boolean;
}) {
  const response = await getApiInstance().post("/forms/", formData);
  return response.data;
}

export async function updateForm(
  slug: string,
  formData: Partial<{
    name: string;
    description: string;
    is_active: boolean;
    schema: object;
  }>
) {
  const response = await getApiInstance().patch(`/forms/${slug}/`, formData);
  return response.data;
}

// ── Fields ─────────────────────────────────────────────────────────────────
export async function createField(
  formSlug: string,
  fieldData: {
    key: string;
    label: string;
    field_type: string;
    required?: boolean;
    options?: unknown;
    validation?: unknown;
    order?: number;
    placeholder?: string;
    help_text?: string;
  }
) {
  const response = await getApiInstance().post(`/forms/${formSlug}/fields/`, fieldData);
  return response.data;
}

export async function deleteField(formSlug: string, fieldId: string) {
  await getApiInstance().delete(`/forms/${formSlug}/fields/${fieldId}/`);
}

// ── Submissions ────────────────────────────────────────────────────────────
// Two-step submission matches the backend's two-endpoint design:
//  1. POST /submissions/ with JSON responses → returns submission UUID
//  2. POST /submissions/{id}/upload/ for each file field
export async function submitForm(
  formId: string,
  textValues: Record<string, unknown>,
  files: Record<string, File | File[]>
): Promise<{ id: string }> {
  // Step 1: create submission (JSON only — no multipart here)
  const api = getApiInstance();
  const submissionRes = await api.post("/submissions/", {
    form: formId,           // backend expects UUID
    responses: textValues,  // backend expects 'responses', not 'text_values'
  });
  const submissionId: string = submissionRes.data.id;

  // Step 2: upload each file to the dedicated upload endpoint
  // Skip if user is not authenticated (backend requires auth for file uploads)
  for (const [fieldKey, fileOrFiles] of Object.entries(files)) {
        const fileList = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
        for (const file of fileList) {
          const fd = new FormData();
          fd.append("field_key", fieldKey);
          fd.append("file", file);
          await api.post(`/submissions/${submissionId}/upload/`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

  return submissionRes.data;
}

export async function getSubmissions(page = 1): Promise<any[]> {
  const response = await getApiInstance().get(`/submissions/?page=${page}`);
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.results) return data.results;
  return [];
}

export async function updateSubmissionStatus(id: string, status: string) {
  const response = await getApiInstance().patch(`/submissions/${id}/status/`, { status });
  return response.data;
}

// ── Notifications ──────────────────────────────────────────────────────────
export async function getNotifications() {
  const response = await getApiInstance().get("/notifications/");
  return Array.isArray(response.data)
    ? response.data
    : (response.data.results ?? []);
}

