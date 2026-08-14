/**
 * Platform detection and embed URL generation utilities
 */

export type Platform = "youtube" | "instagram" | "sharechat" | "unknown";

export interface ReelMeta {
  platform: Platform;
  embedUrl: string;
  videoId: string | null;
}

export function detectPlatform(url: string): Platform {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") {
      return "youtube";
    }
    if (host === "instagram.com" || host === "www.instagram.com") {
      return "instagram";
    }
    if (host === "sharechat.com" || host === "b.sharechat.com") {
      return "sharechat";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/shorts/ID
    const shortsMatch = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) return shortsMatch[1];

    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }

    // youtube.com/watch?v=ID
    const v = u.searchParams.get("v");
    if (v) return v;

    // youtube.com/embed/ID
    const embedMatch = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];

    return null;
  } catch {
    return null;
  }
}

export function extractInstagramId(url: string): string | null {
  try {
    const u = new URL(url);
    // instagram.com/reel/ID/ or instagram.com/p/ID/
    const match = u.pathname.match(/\/(reel|p)\/([a-zA-Z0-9_-]+)/);
    if (match) return match[2];
    return null;
  } catch {
    return null;
  }
}

export function extractShareChatId(url: string): string | null {
  try {
    const u = new URL(url);
    // sharechat.com/video/title/hashid
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

export function generateEmbedUrl(url: string): ReelMeta {
  const platform = detectPlatform(url);

  switch (platform) {
    case "youtube": {
      const id = extractYouTubeId(url);
      if (!id) return { platform, embedUrl: url, videoId: null };
      return {
        platform,
        videoId: id,
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`,
      };
    }

    case "instagram": {
      const id = extractInstagramId(url);
      if (!id) return { platform, embedUrl: url, videoId: null };
      return {
        platform,
        videoId: id,
        // Instagram embed uses the /embed/ endpoint
        embedUrl: `https://www.instagram.com/reel/${id}/embed/`,
      };
    }

    case "sharechat": {
      const id = extractShareChatId(url);
      return {
        platform,
        videoId: id,
        embedUrl: url, // ShareChat doesn't provide a stable embed endpoint; open in new tab
      };
    }

    default:
      return { platform: "unknown", embedUrl: url, videoId: null };
  }
}

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "instagram":
      return "Instagram";
    case "sharechat":
      return "ShareChat";
    default:
      return "Unknown";
  }
}

export function platformColor(platform: Platform): string {
  switch (platform) {
    case "youtube":
      return "#ff0000";
    case "instagram":
      return "#e1306c";
    case "sharechat":
      return "#ff6600";
    default:
      return "#888";
  }
}
