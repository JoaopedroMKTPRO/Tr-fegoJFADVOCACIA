import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PostEditor from "@/components/PostEditor";
import { parseMediaJson } from "@/lib/utils";
import type { MediaItem } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (rows.length === 0) notFound();
  const post = rows[0];
  const media = parseMediaJson<MediaItem>(post.mediaJson);
  return <PostEditor post={post} initialMedia={media} />;
}
