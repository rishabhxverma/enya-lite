/**
 * Real YouTube Data API v3 search. Falls back to a curated list when the
 * API key is missing or quota is exhausted.
 */
import axios from "axios";

export interface YouTubeCandidate {
  youtubeId: string;
  title: string;
  channel: string;
  duration: number; // seconds
  thumbnailUrl: string;
}

export interface SearchYouTubeArgs {
  topic: string;
  gradeLevel: number;
  maxDurationSeconds?: number;
  preferredChannels?: string[];
}

const FALLBACK: YouTubeCandidate[] = [
  {
    youtubeId: "UPBMG5EYydo",
    title: "Photosynthesis | Educational Video for Kids",
    channel: "Happy Learning English",
    duration: 240,
    thumbnailUrl: "https://i.ytimg.com/vi/UPBMG5EYydo/hqdefault.jpg",
  },
  {
    youtubeId: "D1Ymc311XS8",
    title: "Photosynthesis For Kids",
    channel: "Peekaboo Kidz",
    duration: 312,
    thumbnailUrl: "https://i.ytimg.com/vi/D1Ymc311XS8/hqdefault.jpg",
  },
  {
    youtubeId: "g78utcLQrJ4",
    title: "How Do Plants Make Food",
    channel: "FuseSchool",
    duration: 350,
    thumbnailUrl: "https://i.ytimg.com/vi/g78utcLQrJ4/hqdefault.jpg",
  },
];

function parseDurationISO8601(iso: string): number {
  // PT#H#M#S
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? "0", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const s = parseInt(m[3] ?? "0", 10);
  return h * 3600 + min * 60 + s;
}

export async function searchYouTubeVideo(
  args: SearchYouTubeArgs
): Promise<{ candidates: YouTubeCandidate[] }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[youtube-search] YOUTUBE_API_KEY missing — using fallback");
    return { candidates: FALLBACK };
  }
  const maxDuration = args.maxDurationSeconds ?? 720; // 12 min default

  const channelHints = args.preferredChannels?.length
    ? ` ${args.preferredChannels.join(" OR ")}`
    : " (Crash Course Kids OR SciShow Kids OR National Geographic Kids OR FuseSchool)";
  const query = `${args.topic} for grade ${args.gradeLevel} kids${channelHints}`;

  try {
    const search = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          key: apiKey,
          q: query,
          part: "snippet",
          type: "video",
          videoEmbeddable: "true",
          safeSearch: "strict",
          videoDuration: "short", // <4min — adjust based on maxDuration below
          maxResults: 8,
        },
        timeout: 8000,
      }
    );
    const items = (search.data?.items ?? []) as Array<{
      id?: { videoId?: string };
      snippet?: { title?: string; channelTitle?: string; thumbnails?: Record<string, { url: string }> };
    }>;
    const ids = items.map((i) => i.id?.videoId).filter((s): s is string => !!s);
    if (ids.length === 0) {
      console.warn("[youtube-search] no items — using fallback");
      return { candidates: FALLBACK };
    }
    // Pull durations.
    const details = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          key: apiKey,
          id: ids.join(","),
          part: "contentDetails,snippet",
        },
        timeout: 8000,
      }
    );
    const detailItems = (details.data?.items ?? []) as Array<{
      id: string;
      snippet?: { title?: string; channelTitle?: string; thumbnails?: Record<string, { url: string }> };
      contentDetails?: { duration?: string };
    }>;
    const candidates: YouTubeCandidate[] = detailItems
      .map((d) => {
        const duration = parseDurationISO8601(d.contentDetails?.duration ?? "");
        const thumb =
          d.snippet?.thumbnails?.high?.url ??
          d.snippet?.thumbnails?.medium?.url ??
          d.snippet?.thumbnails?.default?.url ??
          `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`;
        return {
          youtubeId: d.id,
          title: d.snippet?.title ?? "(untitled)",
          channel: d.snippet?.channelTitle ?? "",
          duration,
          thumbnailUrl: thumb,
        };
      })
      .filter((c) => c.duration > 0 && c.duration <= maxDuration)
      .slice(0, 3);
    if (candidates.length === 0) {
      console.warn("[youtube-search] no candidates after duration filter — using fallback");
      return { candidates: FALLBACK };
    }
    return { candidates };
  } catch (err) {
    console.warn(
      `[youtube-search] error, falling back: ${err instanceof Error ? err.message : String(err)}`
    );
    return { candidates: FALLBACK };
  }
}
