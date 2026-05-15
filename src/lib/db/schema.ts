import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  igUserId: text("ig_user_id").notNull().unique(),
  username: text("username").notNull(),
  accountType: text("account_type"),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: integer("token_expires_at"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type PostType = "image" | "carousel" | "reel" | "story";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  type: text("type").$type<PostType>().notNull(),
  status: text("status").$type<PostStatus>().notNull().default("draft"),
  caption: text("caption").default(""),
  // JSON array de { url, type: 'image' | 'video', publicId? }
  mediaJson: text("media_json").notNull().default("[]"),
  scheduledAt: integer("scheduled_at"),
  publishedAt: integer("published_at"),
  igMediaId: text("ig_media_id"),
  igPermalink: text("ig_permalink"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export interface MediaItem {
  url: string;
  type: "image" | "video";
  publicId?: string;
  width?: number;
  height?: number;
}
