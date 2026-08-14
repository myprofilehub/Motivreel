export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { generateEmbedUrl } from "@/lib/platforms";
import { downloadVideo } from "@/lib/downloader";

// GET /api/reels — public
export async function GET() {
  const reels = await prisma.reel.findMany({
    orderBy: [{ order: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(reels);
}

// POST /api/reels — admin only
export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, title } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const { platform, embedUrl } = generateEmbedUrl(url.trim());

  if (platform === "unknown") {
    return NextResponse.json(
      { error: "Unsupported platform. Please use YouTube, Instagram, or ShareChat URLs." },
      { status: 400 }
    );
  }

  // 1. Save reel immediately with status="downloading"
  let reel;
  try {
    reel = await prisma.reel.create({
      data: {
        url: url.trim(),
        platform,
        embedUrl,
        title: title?.trim() || "",
        status: "downloading",
        order: 0,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "This URL has already been added." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: `Failed to save reel: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  // 2. Kick off download in the background (don't await — respond instantly)
  downloadVideo(url.trim(), reel.id)
    .then(async (result) => {
      await prisma.reel.update({
        where: { id: reel.id },
        data: {
          videoPath: result.videoPath,
          thumbnail: result.thumbnail,
          title: reel.title || result.title,
          status: "ready",
        },
      });
      console.log(`✅ Reel ${reel.id} downloaded: ${result.videoPath}`);
    })
    .catch(async (err) => {
      console.error(`❌ Reel ${reel.id} download failed:`, err.message);
      await prisma.reel.update({
        where: { id: reel.id },
        data: { status: "failed" },
      });
    });

  // 3. Respond immediately — frontend will poll for status
  return NextResponse.json(reel, { status: 201 });
}
