import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function PublishedPage() {
  const list = await db
    .select()
    .from(posts)
    .where(inArray(posts.status, ["published", "failed"] as const))
    .orderBy(desc(posts.publishedAt), desc(posts.updatedAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Publicados</h1>
        <p className="text-sm text-zinc-500">Histórico de publicações e falhas.</p>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">Nada publicado ainda.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
