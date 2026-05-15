import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import Link from "next/link";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const acc = await db.select().from(accounts).limit(1);
  if (acc.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <h1 className="text-xl font-semibold">Conecte sua conta primeiro</h1>
        <p className="text-sm text-zinc-600">
          Antes de criar conteúdo, vá em <Link href="/settings" className="text-brand-700 underline">Configurações</Link> e
          conecte sua conta do Instagram.
        </p>
      </div>
    );
  }
  return <PostEditor />;
}
