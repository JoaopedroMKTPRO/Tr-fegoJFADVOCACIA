import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import StatusBadge from "./StatusBadge";
import type { Post, MediaItem } from "@/lib/db/schema";
import { parseMediaJson } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  image: "Foto",
  carousel: "Carrossel",
  reel: "Reel",
  story: "Story",
};

export default function PostCard({ post }: { post: Post }) {
  const media = parseMediaJson<MediaItem>(post.mediaJson);
  const cover = media[0];
  const when =
    post.status === "published" && post.publishedAt
      ? `Publicado em ${format(new Date(post.publishedAt * 1000), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
      : post.scheduledAt
      ? `Agendado para ${format(new Date(post.scheduledAt * 1000), "dd/MM/yyyy HH:mm", { locale: ptBR })}`
      : `Atualizado em ${format(new Date(post.updatedAt * 1000), "dd/MM/yyyy HH:mm", { locale: ptBR })}`;

  return (
    <Link
      href={`/posts/${post.id}`}
      className="group flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {cover ? (
          cover.type === "video" ? (
            <video src={cover.url} className="h-full w-full object-cover" muted playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
            sem mídia
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {TYPE_LABEL[post.type] ?? post.type}
          </span>
          <StatusBadge status={post.status} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-800">
          {post.caption || <span className="text-zinc-400">Sem legenda</span>}
        </p>
        <span className="mt-auto text-xs text-zinc-500">{when}</span>
        {post.errorMessage && (
          <span className="mt-1 line-clamp-1 text-xs text-red-600">{post.errorMessage}</span>
        )}
      </div>
    </Link>
  );
}
