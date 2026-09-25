import { NextResponse } from "next/server";

export function successResponse<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details: errors,
      },
    },
    { status }
  );
}
