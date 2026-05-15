import { v2 as cloudinary } from "cloudinary";

let configured = false;
function ensure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function getSignedUploadParams(folder = "instagram"): SignedUploadParams {
  ensure();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary não configurado. Defina CLOUDINARY_* nas variáveis de ambiente.");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
  return { timestamp, signature, apiKey, cloudName, folder };
}

export async function deleteAsset(publicId: string, resourceType: "image" | "video" = "image") {
  ensure();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
