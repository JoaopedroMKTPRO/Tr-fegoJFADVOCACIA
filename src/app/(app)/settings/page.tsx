import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const list = await db.select().from(accounts);
  const safe = list.map((a) => ({
    id: a.id,
    igUserId: a.igUserId,
    username: a.username,
    accountType: a.accountType,
    tokenExpiresAt: a.tokenExpiresAt,
    createdAt: a.createdAt,
  }));
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
  return <SettingsClient accounts={safe} cloudinaryConfigured={cloudinaryConfigured} />;
}
