import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "personal-blog",
    timestamp: new Date().toISOString(),
  });
}
