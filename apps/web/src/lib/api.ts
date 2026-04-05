import { auth } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5030/api";

export async function fetchServerApi(endpoint: string, options: RequestInit = {}) {
  const session = await auth();
  const token = (session as any)?.supabaseAccessToken;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
     const errorBody = await res.json().catch(() => ({}));
     throw new Error(errorBody?.error?.message || `API Error: ${res.status}`);
  }

  return res;
}

export async function getServerBrands() {
  const res = await fetchServerApi("/brands", { cache: 'no-store' });
  return res.json();
}

export async function getServerBrand(brandId: string) {
  const res = await fetchServerApi(`/brands/${brandId}`, { cache: 'no-store' });
  return res.json();
}
