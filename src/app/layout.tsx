import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JF Advocacia · Studio Instagram",
  description: "Plataforma de organização, agendamento e publicação de conteúdo no Instagram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
