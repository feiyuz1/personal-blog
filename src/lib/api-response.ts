import { NextResponse } from "next/server";

import type { ApiResponse, RouteContract } from "@/types/api";

function normalizeJsonValue(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }
  if (value && typeof value === "object") {
    const normalized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        normalized[key] = normalizeJsonValue(entry);
      }
    }
    return normalized;
  }
  return value;
}

export function ok<T>(data: T, message = "success") {
  const body: ApiResponse<T> = {
    code: 0,
    message,
    data: normalizeJsonValue(data) as T,
  };

  return NextResponse.json(body);
}

export function notImplemented(contract: RouteContract) {
  const body: ApiResponse<RouteContract> = {
    code: 501,
    message: "not implemented",
    data: contract,
  };

  return NextResponse.json(body, { status: 501 });
}

export function unauthorized(message = "unauthorized") {
  const body: ApiResponse<null> = {
    code: 401,
    message,
    data: null,
  };
  return NextResponse.json(body, { status: 401 });
}

export function notFound(message = "not found") {
  const body: ApiResponse<null> = {
    code: 404,
    message,
    data: null,
  };
  return NextResponse.json(body, { status: 404 });
}
