import { NextResponse } from "next/server";
import { getSignedUploadParams } from "@/lib/cloudinary";

export async function POST() {
  try {
    const params = getSignedUploadParams();
    return NextResponse.json(params);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao assinar upload";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
