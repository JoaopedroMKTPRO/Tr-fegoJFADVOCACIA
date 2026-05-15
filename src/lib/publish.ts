import { eq } from "drizzle-orm";
import { db } from "./db";
import { posts, type Post, type MediaItem } from "./db/schema";
import {
  publishImage,
  publishCarousel,
  publishReel,
  publishStory,
  type PublishResult,
} from "./instagram";
import { parseMediaJson, unixNow } from "./utils";

export async function publishPost(post: Post, account: { igUserId: string; accessToken: string }) {
  await db
    .update(posts)
    .set({ status: "publishing", updatedAt: unixNow() })
    .where(eq(posts.id, post.id));

  try {
    const media = parseMediaJson<MediaItem>(post.mediaJson);
    if (media.length === 0) throw new Error("Nenhuma mídia anexada ao post.");

    let result: PublishResult;
    switch (post.type) {
      case "image": {
        const item = media[0];
        if (item.type !== "image") throw new Error("Post do tipo image precisa de uma imagem.");
        result = await publishImage({
          igUserId: account.igUserId,
          accessToken: account.accessToken,
          imageUrl: item.url,
          caption: post.caption ?? undefined,
        });
        break;
      }
      case "carousel": {
        result = await publishCarousel({
          igUserId: account.igUserId,
          accessToken: account.accessToken,
          items: media,
          caption: post.caption ?? undefined,
        });
        break;
      }
      case "reel": {
        const item = media[0];
        if (item.type !== "video") throw new Error("Reel precisa de um vídeo.");
        result = await publishReel({
          igUserId: account.igUserId,
          accessToken: account.accessToken,
          videoUrl: item.url,
          caption: post.caption ?? undefined,
        });
        break;
      }
      case "story": {
        const item = media[0];
        result = await publishStory({
          igUserId: account.igUserId,
          accessToken: account.accessToken,
          url: item.url,
          type: item.type,
        });
        break;
      }
      default:
        throw new Error(`Tipo desconhecido: ${post.type}`);
    }

    await db
      .update(posts)
      .set({
        status: "published",
        publishedAt: unixNow(),
        igMediaId: result.igMediaId,
        igPermalink: result.permalink ?? null,
        errorMessage: null,
        updatedAt: unixNow(),
      })
      .where(eq(posts.id, post.id));

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(posts)
      .set({ status: "failed", errorMessage: message, updatedAt: unixNow() })
      .where(eq(posts.id, post.id));
    throw err;
  }
}
