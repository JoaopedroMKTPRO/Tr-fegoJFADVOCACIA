"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

interface Account {
  id: string;
  igUserId: string;
  username: string;
  accountType: string | null;
  tokenExpiresAt: number | null;
  createdAt: number;
}

export default function SettingsClient({
  accounts,
  cloudinaryConfigured,
}: {
  accounts: Account[];
  cloudinaryConfigured: boolean;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setMsg({ kind: "ok", text: `Conta @${data.username} conectada.` });
      setToken("");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setLoading(false);
    }
  }

  async function disconnect(id: string) {
    if (!confirm("Desconectar esta conta? Os posts ficarão órfãos.")) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configurações</h1>
        <p className="text-sm text-zinc-500">Gerencie sua conta do Instagram e integrações.</p>
      </div>

      {!cloudinaryConfigured && (
        <div className="card flex items-start gap-3 border-amber-200 bg-amber-50">
          <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
          <div className="text-sm text-amber-900">
            <strong>Cloudinary não configurado.</strong> Defina <code>CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code>CLOUDINARY_API_KEY</code> e <code>CLOUDINARY_API_SECRET</code> nas variáveis de ambiente para
            habilitar uploads de mídia.
          </div>
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Conta do Instagram</h2>
          <p className="text-sm text-zinc-500">
            Cole abaixo o token de acesso de longa duração gerado no seu app Meta (Instagram Login).
          </p>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">@{a.username}</p>
                    <p className="text-xs text-zinc-500">
                      {a.accountType ?? "—"} · IG ID {a.igUserId}
                      {a.tokenExpiresAt
                        ? ` · token expira em ${new Date(a.tokenExpiresAt * 1000).toLocaleDateString("pt-BR")}`
                        : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => disconnect(a.id)} className="btn-ghost text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={connect} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="token" className="label">
              Token de acesso
            </label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={3}
              required
              className="input font-mono text-xs"
              placeholder="IGAA..."
            />
          </div>
          {msg && (
            <p className={msg.kind === "ok" ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
              {msg.text}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={loading || !token.trim()}>
            {loading ? "Validando..." : accounts.length > 0 ? "Atualizar token" : "Conectar conta"}
          </button>
        </form>
      </div>

      <div className="card text-sm text-zinc-600">
        <h3 className="mb-2 font-semibold text-zinc-900">Como obter o token</h3>
        <ol className="ml-5 list-decimal space-y-1">
          <li>
            Acesse <a className="text-brand-700 underline" href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">developers.facebook.com/apps</a> e abra seu app.
          </li>
          <li>
            Em <em>Instagram → API setup with Instagram Login</em>, gere o <strong>access token de longa duração</strong> (válido por ~60 dias) para a conta de negócio do Instagram.
          </li>
          <li>Cole o token acima. A plataforma renova o token automaticamente perto do vencimento.</li>
          <li>
            Permissões necessárias: <code>instagram_business_basic</code>, <code>instagram_business_content_publish</code>,{" "}
            <code>instagram_business_manage_comments</code> (opcional).
          </li>
        </ol>
      </div>
    </div>
  );
}
