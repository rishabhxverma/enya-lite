import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const apiKey = process.env.YOUTUBE_API_KEY;
  const topic = body.topic ?? "photosynthesis";
  const gradeLevel = body.gradeLevel ?? 3;

  const fallback = {
    candidates: [
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
    ],
    _stub: true,
  };

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  try {
    const { data } = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: `${topic} for grade ${gradeLevel} kids`,
          type: "video",
          maxResults: 5,
          videoEmbeddable: "true",
          safeSearch: "strict",
          relevanceLanguage: "en",
          key: apiKey,
        },
        timeout: 8_000,
      }
    );
    type YTItem = {
      id: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: { high?: { url?: string }; default?: { url?: string } };
      };
    };
    const items = (data.items as YTItem[]) ?? [];
    const candidates = items.slice(0, 3).map((item) => ({
      youtubeId: item.id.videoId ?? "",
      title: item.snippet?.title ?? "",
      channel: item.snippet?.channelTitle ?? "",
      duration: 0,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.default?.url ??
        "",
    }));
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[search-youtube] failed", err);
    return NextResponse.json(fallback);
  }
}
