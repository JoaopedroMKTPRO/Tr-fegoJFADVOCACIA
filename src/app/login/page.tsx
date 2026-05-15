"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Senha inválida");
      }
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          autoFocus
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha de acesso"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-zinc-100 p-4">
      <div className="card w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-700">JF Advocacia</h1>
          <p className="mt-1 text-sm text-zinc-500">Studio de conteúdo Instagram</p>
        </div>
        <Suspense fallback={<div className="text-sm text-zinc-500">Carregando…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
