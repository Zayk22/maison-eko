import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getOrderWithItems,
  getOrderEvents,
} from "@/server/queries";
import { verifyTrackingMatch } from "@/lib/tracking";
import { trackingLookupSchema } from "@/lib/schemas";
import { consumeRateLimit } from "@/server/rate-limit";
import { RATE_LIMITS, RATE_LIMIT_KEYS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = trackingLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { orderNumber, phone } = parsed.data;

  const h = await headers();
  const ip = h.get("x-real-ip") ?? "dev-ip-fallback";

  // Rate limits: order number and IP. Fail open if the limiter itself is
  // broken, so a customer with a valid order is not locked out by an
  // infrastructure problem.
  const orderLimit = await consumeRateLimit(
    RATE_LIMIT_KEYS.trackOrder(orderNumber),
    RATE_LIMITS.trackPerOrderNumber.limit,
    RATE_LIMITS.trackPerOrderNumber.windowMs,
    "open",
  );
  const ipLimit = await consumeRateLimit(
    RATE_LIMIT_KEYS.trackIp(ip),
    RATE_LIMITS.trackPerIp.limit,
    RATE_LIMITS.trackPerIp.windowMs,
    "open",
  );
  if (!orderLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const order = await getOrderWithItems(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Same shape for wrong order number and wrong phone. Do not leak which
  // one was wrong.
  const verify = verifyTrackingMatch(order.phone, orderNumber, phone);
  if (!verify.ok) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const events = await getOrderEvents(order.id);

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    totalKobo: order.totalKobo,
    items: order.items.map((i) => ({
      productName: i.productName,
      sizeMl: i.sizeMl,
      quantity: i.quantity,
    })),
    events: events.map((e) => ({
      status: e.status,
      createdAt: e.createdAt,
      note: e.note,
    })),
  });
}