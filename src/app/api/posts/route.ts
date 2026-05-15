import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, accounts, type PostType } from "@/lib/db/schema";
import { genId, unixNow } from "@/lib/utils";
import { publishPost } from "@/lib/publish";

const mediaItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video"]),
  publicId: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const bodySchema = z.object({
  type: z.enum(["image", "carousel", "reel", "story"]),
  caption: z.string().max(2200).optional().default(""),
  media: z.array(mediaItemSchema).default([]),
  scheduledAt: z.number().nullable().optional(),
  action: z.enum(["draft", "schedule", "publish_now"]).default("draft"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.format() }, { status: 400 });
  }
  const { type, caption, media, scheduledAt, action } = parsed.data;

  const acc = await db.select().from(accounts).limit(1);
  if (acc.length === 0) {
    return NextResponse.json({ error: "Nenhuma conta do Instagram conectada." }, { status: 400 });
  }
  const account = acc[0];

  if ((action === "publish_now" || action === "schedule") && media.length === 0) {
    return NextResponse.json({ error: "Anexe pelo menos uma mídia." }, { status: 400 });
  }

  const id = genId();
  const status =
    action === "publish_now" ? "publishing" : action === "schedule" ? "scheduled" : "draft";

  await db.insert(posts).values({
    id,
    accountId: account.id,
    type: type as PostType,
    status,
    caption,
    mediaJson: JSON.stringify(media),
    scheduledAt: action === "schedule" ? scheduledAt ?? null : null,
    createdAt: unixNow(),
    updatedAt: unixNow(),
  });

  if (action === "publish_now") {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    try {
      await publishPost(post, account);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ id, error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ id });
}
