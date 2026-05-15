"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import type { MediaItem } from "@/lib/db/schema";

interface Props {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxItems?: number;
  accept?: string;
}

export default function MediaUploader({ value, onChange, maxItems = 10, accept = "image/*,video/*" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<MediaItem> {
    const sigRes = await fetch("/api/uploads/sign", { method: "POST" });
    if (!sigRes.ok) throw new Error("Falha ao assinar upload (Cloudinary configurado?)");
    const { timestamp, signature, apiKey, cloudName, folder } = await sigRes.json();

    const isVideo = file.type.startsWith("video/");
    const resource = isVideo ? "video" : "image";

    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    fd.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Cloudinary: ${t}`);
    }
    const data = await res.json();
    return {
      url: data.secure_url,
      type: isVideo ? "video" : "image",
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const remaining = maxItems - value.length;
      const toUpload = files.slice(0, remaining);
      const results: MediaItem[] = [];
      for (const f of toUpload) {
        results.push(await uploadFile(f));
      }
      onChange([...value, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((item, i) => (
          <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {item.type === "video" ? (
              <video src={item.url} className="h-full w-full object-cover" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < maxItems && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-300 bg-white text-xs text-zinc-500 hover:border-brand-400 hover:text-brand-600">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span>{uploading ? "Enviando..." : "Adicionar"}</span>
            <input
              type="file"
              accept={accept}
              multiple={maxItems > 1}
              className="hidden"
              onChange={onPick}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-zinc-500">
        Máximo de {maxItems} arquivo(s). Vídeos podem demorar para processar no Instagram.
      </p>
    </div>
  );
}
