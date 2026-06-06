import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sendMonthlyFeeDelayReminders } from "@/lib/feeReminders";

function safeCompare(value: string | null, expected: string): boolean {
  if (!value) {
    return false;
  }

  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const cronHeader = request.headers.get("x-cron-secret");

  return safeCompare(bearerToken, secret) || safeCompare(cronHeader, secret);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendMonthlyFeeDelayReminders(new Date());
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendMonthlyFeeDelayReminders(new Date());
  return NextResponse.json({ ok: true, ...result });
}
