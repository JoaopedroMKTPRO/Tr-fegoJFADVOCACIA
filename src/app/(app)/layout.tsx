import Link from "next/link";
import { LogOut, Calendar, FileText, Plus, Settings, Image as ImageIcon } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 md:flex">
        <div className="mb-6">
          <Link href="/" className="block">
            <h1 className="text-lg font-bold text-brand-700">JF Studio</h1>
            <p className="text-xs text-zinc-500">Instagram da JF Advocacia</p>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            <Calendar size={16} /> Painel
          </Link>
          <Link href="/posts/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            <Plus size={16} /> Novo conteúdo
          </Link>
          <Link href="/drafts" className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            <FileText size={16} /> Rascunhos
          </Link>
          <Link href="/published" className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            <ImageIcon size={16} /> Publicados
          </Link>
          <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100">
            <Settings size={16} /> Configurações
          </Link>
        </nav>
        <div className="mt-auto pt-4">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex w-full flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <Link href="/" className="text-base font-bold text-brand-700">
            JF Studio
          </Link>
          <LogoutButton compact />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 text-sm md:hidden">
          <Link href="/" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-100">Painel</Link>
          <Link href="/posts/new" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-100">Novo</Link>
          <Link href="/drafts" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-100">Rascunhos</Link>
          <Link href="/published" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-100">Publicados</Link>
          <Link href="/settings" className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-100">Config</Link>
        </nav>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
