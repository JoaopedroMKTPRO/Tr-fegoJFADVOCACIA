import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { genId, unixNow } from "@/lib/utils";
import { getMe } from "@/lib/instagram";

const bodySchema = z.object({
  accessToken: z.string().min(20),
});

export async function GET() {
  const list = await db.select().from(accounts);
  const safe = list.map((a) => ({
    id: a.id,
    igUserId: a.igUserId,
    username: a.username,
    accountType: a.accountType,
    tokenExpiresAt: a.tokenExpiresAt,
    createdAt: a.createdAt,
  }));
  return NextResponse.json({ accounts: safe });
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

  let info;
  try {
    info = await getMe(parsed.data.accessToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao validar token";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const igUserId = info.user_id ?? info.id;
  const existing = await db.select().from(accounts).where(eq(accounts.igUserId, igUserId)).limit(1);
  if (existing.length > 0) {
    await db
      .update(accounts)
      .set({
        accessToken: parsed.data.accessToken,
        username: info.username,
        accountType: info.account_type ?? null,
        updatedAt: unixNow(),
      })
      .where(eq(accounts.id, existing[0].id));
    return NextResponse.json({ id: existing[0].id, username: info.username, updated: true });
  }

  const id = genId();
  await db.insert(accounts).values({
    id,
    igUserId,
    username: info.username,
    accountType: info.account_type ?? null,
    accessToken: parsed.data.accessToken,
  });
  return NextResponse.json({ id, username: info.username });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await db.delete(accounts).where(eq(accounts.id, id));
  return NextResponse.json({ ok: true });
}
