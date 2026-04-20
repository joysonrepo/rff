import { NextResponse } from "next/server";
import { sendMonthlyFeeDelayReminders } from "@/lib/feeReminders";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronHeader = request.headers.get("x-cron-secret");
  const queryToken = new URL(request.url).searchParams.get("secret");

  return bearerToken === secret || cronHeader === secret || queryToken === secret;
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
