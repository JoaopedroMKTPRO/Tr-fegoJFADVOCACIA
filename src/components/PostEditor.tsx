"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import MediaUploader from "./MediaUploader";
import type { Post, MediaItem, PostType } from "@/lib/db/schema";
import { Send, Save, Clock, Trash2, ExternalLink } from "lucide-react";

interface Props {
  post?: Post;
  initialMedia?: MediaItem[];
}

const TYPE_OPTIONS: { value: PostType; label: string; help: string; max: number; accept: string }[] = [
  { value: "image", label: "Foto", help: "Uma imagem com legenda.", max: 1, accept: "image/*" },
  { value: "carousel", label: "Carrossel", help: "2 a 10 imagens/vídeos.", max: 10, accept: "image/*,video/*" },
  { value: "reel", label: "Reel", help: "Vídeo curto.", max: 1, accept: "video/*" },
  { value: "story", label: "Story", help: "Imagem ou vídeo (24h).", max: 1, accept: "image/*,video/*" },
];

function toLocalInput(unix?: number | null) {
  if (!unix) return "";
  const d = new Date(unix * 1000);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function fromLocalInput(value: string): number | null {
  if (!value) return null;
  return Math.floor(new Date(value).getTime() / 1000);
}

export default function PostEditor({ post, initialMedia = [] }: Props) {
  const router = useRouter();
  const [type, setType] = useState<PostType>((post?.type as PostType) ?? "image");
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [scheduledAt, setScheduledAt] = useState<string>(toLocalInput(post?.scheduledAt));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const typeMeta = TYPE_OPTIONS.find((o) => o.value === type)!;

  async function save(action: "draft" | "schedule" | "publish_now") {
    setError(null);
    const payload = {
      type,
      caption,
      media,
      scheduledAt: action === "schedule" ? fromLocalInput(scheduledAt) : null,
      action,
    };
    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const method = post ? "PATCH" : "POST";
    startTransition(async () => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao salvar");
        return;
      }
      const data = await res.json();
      if (action === "publish_now") {
        router.push(`/posts/${data.id ?? post?.id}`);
      } else {
        router.push("/");
      }
      router.refresh();
    });
  }

  async function remove() {
    if (!post) return;
    if (!confirm("Excluir este conteúdo?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Não foi possível excluir.");
    }
  }

  const isPublished = post?.status === "published";
  const canEdit = !isPublished;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{post ? "Editar conteúdo" : "Novo conteúdo"}</h1>
        {post && post.errorMessage && (
          <p className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{post.errorMessage}</p>
        )}
        {post?.igPermalink && (
          <a
            href={post.igPermalink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
          >
            Ver no Instagram <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="card space-y-2">
        <label className="label">Tipo de publicação</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              disabled={!canEdit}
              onClick={() => setType(opt.value)}
              className={
                "rounded-lg border px-3 py-2 text-sm transition " +
                (type === opt.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-300")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">{typeMeta.help}</p>
      </div>

      <div className="card space-y-3">
        <label className="label">Mídia</label>
        <MediaUploader
          value={media}
          onChange={setMedia}
          maxItems={typeMeta.max}
          accept={typeMeta.accept}
        />
      </div>

      <div className="card space-y-2">
        <label className="label" htmlFor="caption">Legenda</label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          className="input resize-y"
          placeholder={type === "story" ? "Stories não exibem legenda no feed." : "Escreva a legenda…"}
          disabled={!canEdit || type === "story"}
        />
        <p className="text-xs text-zinc-500">{caption.length} caracteres</p>
      </div>

      <div className="card space-y-2">
        <label className="label" htmlFor="scheduled">Agendar para</label>
        <input
          id="scheduled"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="input"
          disabled={!canEdit}
        />
        <p className="text-xs text-zinc-500">Deixe em branco para salvar como rascunho ou publicar agora.</p>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => save("draft")} className="btn-outline" disabled={isPending}>
              <Save size={16} /> Salvar rascunho
            </button>
            <button
              onClick={() => save("schedule")}
              className="btn-primary"
              disabled={isPending || !scheduledAt || media.length === 0}
            >
              <Clock size={16} /> Agendar
            </button>
            <button
              onClick={() => save("publish_now")}
              className="btn-primary"
              disabled={isPending || media.length === 0}
            >
              <Send size={16} /> Publicar agora
            </button>
          </div>
          {post && (
            <button onClick={remove} className="btn-danger" disabled={isPending}>
              <Trash2 size={16} /> Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
