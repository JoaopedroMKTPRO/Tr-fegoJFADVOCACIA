import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, accounts, type PostType } from "@/lib/db/schema";
import { unixNow } from "@/lib/utils";
import { publishPost } from "@/lib/publish";

const mediaItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video"]),
  publicId: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const patchSchema = z.object({
  type: z.enum(["image", "carousel", "reel", "story"]),
  caption: z.string().max(2200).optional().default(""),
  media: z.array(mediaItemSchema).default([]),
  scheduledAt: z.number().nullable().optional(),
  action: z.enum(["draft", "schedule", "publish_now"]).default("draft"),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }
  const { type, caption, media, scheduledAt, action } = parsed.data;

  const [existing] = await db.select().from(posts).where(eq(posts.id, id));
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (existing.status === "published") {
    return NextResponse.json({ error: "Não é possível editar post já publicado." }, { status: 400 });
  }

  const status =
    action === "publish_now" ? "publishing" : action === "schedule" ? "scheduled" : "draft";

  await db
    .update(posts)
    .set({
      type: type as PostType,
      caption,
      mediaJson: JSON.stringify(media),
      scheduledAt: action === "schedule" ? scheduledAt ?? null : null,
      status,
      errorMessage: null,
      updatedAt: unixNow(),
    })
    .where(eq(posts.id, id));

  if (action === "publish_now") {
    const acc = await db.select().from(accounts).where(eq(accounts.id, existing.accountId)).limit(1);
    if (acc.length === 0) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 400 });
    }
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    try {
      await publishPost(post, acc[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ id, error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ id });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await db.delete(posts).where(eq(posts.id, id));
  return NextResponse.json({ ok: true });
}
