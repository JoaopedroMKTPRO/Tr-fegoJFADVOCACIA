import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, accounts } from "@/lib/db/schema";
import { publishPost } from "@/lib/publish";
import { unixNow } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-vercel-cron")) return true;
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = unixNow();
  const due = await db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, now)))
    .limit(10);

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const post of due) {
    const acc = await db.select().from(accounts).where(eq(accounts.id, post.accountId)).limit(1);
    if (acc.length === 0) {
      results.push({ id: post.id, ok: false, error: "Conta não encontrada" });
      continue;
    }
    try {
      await publishPost(post, acc[0]);
      results.push({ id: post.id, ok: true });
    } catch (err) {
      results.push({ id: post.id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
