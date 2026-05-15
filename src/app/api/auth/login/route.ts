import { NextResponse } from "next/server";
import { checkPassword, setSessionCookie, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const token = await signSession();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
