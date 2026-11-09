import { NextResponse } from "next/server";
import { z } from "zod";
import { getVariantsByIds } from "@/server/queries";

export const runtime = "nodejs";

const querySchema = z.object({
  ids: z.string().max(2000).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    ids: url.searchParams.get("ids") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid query" }, { status: 400 });
  }
  const raw = parsed.data.ids ?? "";
  const ids = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  ).slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ variants: [] });
  }

  const variants = await getVariantsByIds(ids);
  return NextResponse.json({ variants });
}