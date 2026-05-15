import Link from "next/link";
import { db } from "@/lib/db";
import { posts, accounts } from "@/lib/db/schema";
import { desc, inArray, eq } from "drizzle-orm";
import PostCard from "@/components/PostCard";
import { Plus, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const accountList = await db.select().from(accounts).limit(1);
  const hasAccount = accountList.length > 0;

  const upcoming = hasAccount
    ? await db
        .select()
        .from(posts)
        .where(inArray(posts.status, ["scheduled", "publishing"] as const))
        .orderBy(posts.scheduledAt)
        .limit(20)
    : [];

  const drafts = hasAccount
    ? await db
        .select()
        .from(posts)
        .where(eq(posts.status, "draft"))
        .orderBy(desc(posts.updatedAt))
        .limit(10)
    : [];

  const recent = hasAccount
    ? await db
        .select()
        .from(posts)
        .where(inArray(posts.status, ["published", "failed"] as const))
        .orderBy(desc(posts.publishedAt))
        .limit(6)
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Painel</h1>
          <p className="text-sm text-zinc-500">
            {hasAccount
              ? `Conta conectada: @${accountList[0].username}`
              : "Conecte sua conta do Instagram para começar."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/posts/new" className="btn-primary">
            <Plus size={16} /> Novo conteúdo
          </Link>
          <Link href="/settings" className="btn-outline">
            Configurações
          </Link>
        </div>
      </div>

      {!hasAccount ? (
        <div className="card flex items-start gap-3 border-amber-200 bg-amber-50">
          <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
          <div>
            <h2 className="font-semibold text-amber-900">Sem conta conectada</h2>
            <p className="mt-1 text-sm text-amber-800">
              Vá em <Link href="/settings" className="underline">Configurações</Link> e cole o token de acesso do
              seu app Meta para conectar.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Agendados</h2>
              <span className="text-sm text-zinc-500">{upcoming.length} item(s)</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum post agendado.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Rascunhos recentes</h2>
              <Link href="/drafts" className="text-sm text-brand-700 hover:underline">Ver todos</Link>
            </div>
            {drafts.length === 0 ? (
              <p className="text-sm text-zinc-500">Sem rascunhos.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {drafts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Atividade recente</h2>
              <Link href="/published" className="text-sm text-brand-700 hover:underline">Ver tudo</Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-zinc-500">Nada publicado ainda.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recent.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
