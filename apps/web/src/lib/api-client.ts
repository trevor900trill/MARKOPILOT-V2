"use client";

import { getSession } from "next-auth/react";
import { toast } from "sonner";

const envApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5030";
const API_BASE_URL = envApiUrl.endsWith("/api") ? envApiUrl : `${envApiUrl}/api`;

async function getToken(): Promise<string | null> {
  const session = await getSession();
  return (session as any)?.supabaseAccessToken ?? null;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  // endpoint should start with a slash, e.g. "/subscriptions/checkout"
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `API Error: ${res.status}`;

    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorBody = await res.json();
        message = errorBody?.error?.message || errorBody?.message || message;
      } else {
        const textError = await res.text();
        if (textError) {
          // Some APIs return "Error Message" (with quotes), so we trim them for the toast
          message = textError.replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      // Fallback to generic message if parsing fails
    }

    // Show visible feedback
    toast.error(message);
    
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export function apiGet<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "GET" });
}

export function apiPost<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "DELETE" });
}
