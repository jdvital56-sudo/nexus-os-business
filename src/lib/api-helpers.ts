import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: any) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation error", 400, error.errors);
  }
  if (error instanceof Response) {
    return error;
  }
  console.error("API Error:", error);
  return apiError("Internal server error", 500);
}

export function parseFormData(request: Request): Promise<FormData> {
  return request.formData();
}

export async function parseJson<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw apiError("Invalid JSON body", 400);
  }
}

export function getSearchParams(url: string) {
  return new URL(url).searchParams;
}

export function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}
