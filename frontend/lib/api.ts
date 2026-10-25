const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserRoleInfo {
  role: string;
  society_id: number | null;
  society_name: string | null;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  roles: UserRoleInfo[];
  is_super_admin: boolean;
}

export interface SocietyItem {
  id: number;
  name: string;
  registration_number: string | null;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  is_active: boolean;
  created_at: string;
}

export interface BuildingItem {
  id: number;
  society_id: number;
  name: string;
  created_at: string;
  flats_count: number;
}

export interface FlatItem {
  id: number;
  building_id: number;
  flat_number: string;
  floor_number: number | null;
  area_sqft: number | null;
  created_at: string;
}

export interface ResidentItem {
  id: number;
  society_id: number;
  user_id: number | null;
  full_name: string;
  phone_number: string | null;
  email: string | null;
  created_at: string;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auditgenai_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(email: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive HttpOnly cookies
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Login failed (${res.status})`);
  }

  const data = await res.json();
  if (typeof window !== "undefined" && data.access_token) {
    localStorage.setItem("auditgenai_token", data.access_token);
  }
  return data;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout request error", err);
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auditgenai_token");
    }
  }
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      ...getAuthHeader(),
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Unauthorized (${res.status})`);
  }

  return res.json();
}

export async function fetchSocieties(): Promise<SocietyItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies`, {
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch societies");
  }
  return res.json();
}

export async function createSociety(payload: {
  name: string;
  registration_number?: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}): Promise<SocietyItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create society");
  }
  return res.json();
}

export async function fetchBuildings(societyId: number): Promise<BuildingItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies/${societyId}/buildings`, {
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch buildings");
  }
  return res.json();
}

export async function createBuilding(societyId: number, name: string): Promise<BuildingItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies/${societyId}/buildings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create building");
  }
  return res.json();
}

export async function fetchFlats(buildingId: number): Promise<FlatItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/buildings/${buildingId}/flats`, {
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch flats");
  }
  return res.json();
}

export async function createFlat(
  buildingId: number,
  payload: { flat_number: string; floor_number?: number; area_sqft?: number }
): Promise<FlatItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/buildings/${buildingId}/flats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create flat");
  }
  return res.json();
}

export async function fetchResidents(societyId: number): Promise<ResidentItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies/${societyId}/residents`, {
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch residents");
  }
  return res.json();
}

export async function createResident(
  societyId: number,
  payload: { full_name: string; phone_number?: string; email?: string }
): Promise<ResidentItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies/${societyId}/residents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create resident");
  }
  return res.json();
}

export async function updateSociety(
  id: number,
  payload: {
    name?: string;
    registration_number?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    is_active?: boolean;
  }
): Promise<SocietyItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update society");
  }
  return res.json();
}

export async function deleteSociety(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/societies/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete society");
  }
  return res.json();
}

export async function updateBuilding(
  id: number,
  name: string
): Promise<BuildingItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/buildings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update building");
  }
  return res.json();
}

export async function deleteBuilding(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/buildings/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete building");
  }
  return res.json();
}

export async function updateFlat(
  id: number,
  payload: {
    flat_number?: string;
    floor_number?: number;
    area_sqft?: number;
  }
): Promise<FlatItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/flats/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update flat");
  }
  return res.json();
}

export async function deleteFlat(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/flats/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete flat");
  }
  return res.json();
}

export async function updateResident(
  id: number,
  payload: {
    full_name?: string;
    phone_number?: string;
    email?: string;
  }
): Promise<ResidentItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/residents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update resident");
  }
  return res.json();
}

export async function deleteResident(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/residents/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete resident");
  }
  return res.json();
}
