import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { refreshLongLivedToken } from "@/lib/instagram";
import { unixNow } from "@/lib/utils";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  if (req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-vercel-cron")) return true;
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const list = await db.select().from(accounts);
  const out: Array<{ id: string; ok: boolean; error?: string; expiresAt?: number }> = [];
  for (const a of list) {
    const needsRefresh =
      !a.tokenExpiresAt || a.tokenExpiresAt - unixNow() < 60 * 60 * 24 * 7;
    if (!needsRefresh) {
      out.push({ id: a.id, ok: true, expiresAt: a.tokenExpiresAt ?? undefined });
      continue;
    }
    try {
      const r = await refreshLongLivedToken(a.accessToken);
      const expiresAt = r.expires_in ? unixNow() + r.expires_in : null;
      await db
        .update(accounts)
        .set({ accessToken: r.access_token, tokenExpiresAt: expiresAt, updatedAt: unixNow() })
        .where(eq(accounts.id, a.id));
      out.push({ id: a.id, ok: true, expiresAt: expiresAt ?? undefined });
    } catch (err) {
      out.push({ id: a.id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return NextResponse.json({ refreshed: out.length, out });
}
