import type { PostStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const STYLES: Record<PostStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  scheduled: "bg-blue-100 text-blue-700",
  publishing: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

const LABELS: Record<PostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  publishing: "Publicando…",
  published: "Publicado",
  failed: "Falhou",
};

export default function StatusBadge({ status }: { status: PostStatus }) {
  return <span className={cn("badge", STYLES[status])}>{LABELS[status]}</span>;
}
