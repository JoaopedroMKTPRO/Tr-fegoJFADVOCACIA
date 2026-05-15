import type { MediaItem } from "./db/schema";

const GRAPH = "https://graph.instagram.com/v21.0";

export interface IgUserInfo {
  id: string;
  username: string;
  account_type?: string;
  user_id?: string;
}

export interface IgTokenInfo {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } })?.error?.message ?? text ?? `HTTP ${res.status}`;
    throw new Error(`Instagram API: ${msg}`);
  }
  return data as T;
}

export async function getMe(accessToken: string): Promise<IgUserInfo> {
  const url = `${GRAPH}/me?fields=id,username,account_type,user_id&access_token=${encodeURIComponent(accessToken)}`;
  return request<IgUserInfo>(url);
}

export async function exchangeForLongLivedToken(
  shortToken: string,
  clientSecret?: string,
): Promise<IgTokenInfo> {
  if (!clientSecret) throw new Error("client_secret necessário para token de longa duração");
  const url = `${GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(shortToken)}`;
  return request<IgTokenInfo>(url);
}

export async function refreshLongLivedToken(longToken: string): Promise<IgTokenInfo> {
  const url = `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(longToken)}`;
  return request<IgTokenInfo>(url);
}

interface CreateMediaParams {
  igUserId: string;
  accessToken: string;
  body: Record<string, string | undefined>;
}

async function createMediaContainer({ igUserId, accessToken, body }: CreateMediaParams): Promise<{ id: string }> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) if (v !== undefined) params.set(k, v);
  params.set("access_token", accessToken);
  const url = `${GRAPH}/${igUserId}/media`;
  return request<{ id: string }>(url, { method: "POST", body: params, headers: {} });
}

async function publishMediaContainer(
  igUserId: string,
  accessToken: string,
  creationId: string,
): Promise<{ id: string }> {
  const params = new URLSearchParams({ creation_id: creationId, access_token: accessToken });
  return request<{ id: string }>(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    body: params,
    headers: {},
  });
}

async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  { timeoutMs = 5 * 60_000, intervalMs = 4_000 } = {},
): Promise<void> {
  const url = `${GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = await request<{ status_code?: string; status?: string }>(url);
    if (r.status_code === "FINISHED") return;
    if (r.status_code === "ERROR" || r.status_code === "EXPIRED") {
      throw new Error(`Container ${containerId} status=${r.status_code}: ${r.status ?? ""}`);
    }
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  throw new Error(`Timeout aguardando container ${containerId}`);
}

export interface PublishResult {
  igMediaId: string;
  permalink?: string;
}

async function fetchPermalink(mediaId: string, accessToken: string): Promise<string | undefined> {
  try {
    const url = `${GRAPH}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`;
    const data = await request<{ permalink?: string }>(url);
    return data.permalink;
  } catch {
    return undefined;
  }
}

export async function publishImage(opts: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption?: string;
}): Promise<PublishResult> {
  const container = await createMediaContainer({
    igUserId: opts.igUserId,
    accessToken: opts.accessToken,
    body: { image_url: opts.imageUrl, caption: opts.caption },
  });
  const published = await publishMediaContainer(opts.igUserId, opts.accessToken, container.id);
  const permalink = await fetchPermalink(published.id, opts.accessToken);
  return { igMediaId: published.id, permalink };
}

export async function publishCarousel(opts: {
  igUserId: string;
  accessToken: string;
  items: MediaItem[];
  caption?: string;
}): Promise<PublishResult> {
  if (opts.items.length < 2 || opts.items.length > 10) {
    throw new Error("Carrossel exige entre 2 e 10 itens.");
  }
  const childIds: string[] = [];
  for (const item of opts.items) {
    const child = await createMediaContainer({
      igUserId: opts.igUserId,
      accessToken: opts.accessToken,
      body:
        item.type === "video"
          ? { video_url: item.url, media_type: "VIDEO", is_carousel_item: "true" }
          : { image_url: item.url, is_carousel_item: "true" },
    });
    if (item.type === "video") {
      await waitForContainerReady(child.id, opts.accessToken);
    }
    childIds.push(child.id);
  }
  const parent = await createMediaContainer({
    igUserId: opts.igUserId,
    accessToken: opts.accessToken,
    body: {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: opts.caption,
    },
  });
  const published = await publishMediaContainer(opts.igUserId, opts.accessToken, parent.id);
  const permalink = await fetchPermalink(published.id, opts.accessToken);
  return { igMediaId: published.id, permalink };
}

export async function publishReel(opts: {
  igUserId: string;
  accessToken: string;
  videoUrl: string;
  caption?: string;
  coverUrl?: string;
}): Promise<PublishResult> {
  const container = await createMediaContainer({
    igUserId: opts.igUserId,
    accessToken: opts.accessToken,
    body: {
      media_type: "REELS",
      video_url: opts.videoUrl,
      caption: opts.caption,
      cover_url: opts.coverUrl,
    },
  });
  await waitForContainerReady(container.id, opts.accessToken);
  const published = await publishMediaContainer(opts.igUserId, opts.accessToken, container.id);
  const permalink = await fetchPermalink(published.id, opts.accessToken);
  return { igMediaId: published.id, permalink };
}

export async function publishStory(opts: {
  igUserId: string;
  accessToken: string;
  url: string;
  type: "image" | "video";
}): Promise<PublishResult> {
  const container = await createMediaContainer({
    igUserId: opts.igUserId,
    accessToken: opts.accessToken,
    body:
      opts.type === "video"
        ? { media_type: "STORIES", video_url: opts.url }
        : { media_type: "STORIES", image_url: opts.url },
  });
  if (opts.type === "video") {
    await waitForContainerReady(container.id, opts.accessToken);
  }
  const published = await publishMediaContainer(opts.igUserId, opts.accessToken, container.id);
  return { igMediaId: published.id };
}
