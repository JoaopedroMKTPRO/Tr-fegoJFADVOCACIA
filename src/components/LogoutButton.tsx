"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className={compact ? "btn-ghost px-2" : "btn-outline w-full"}>
      <LogOut size={16} /> {compact ? null : "Sair"}
    </button>
  );
}
