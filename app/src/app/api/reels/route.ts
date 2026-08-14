export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth";
import { generateEmbedUrl } from "@/lib/platforms";
import { downloadVideo } from "@/lib/downloader";

// GET /api/reels — public
export async function GET() {
  const { data: reels, error } = await supabase
    .from("Reel")
    .select("*")
    .order("order", { ascending: false })
    .order("createdAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(reels || []);
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
  const { data: reel, error } = await supabase
    .from("Reel")
    .insert({
      url: url.trim(),
      platform,
      embedUrl,
      title: title?.trim() || "",
      status: "downloading",
      order: 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // Postgres unique violation
      return NextResponse.json(
        { error: "This URL has already been added." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: `Failed to save reel: ${error.message}` }, { status: 500 });
  }

  // 2. Kick off download in the background (don't await — respond instantly)
  downloadVideo(url.trim(), reel.id)
    .then(async (result) => {
      await supabase
        .from("Reel")
        .update({
          videoPath: result.videoPath,
          thumbnail: result.thumbnail,
          title: reel.title || result.title,
          status: "ready",
        })
        .eq("id", reel.id);
      console.log(`✅ Reel ${reel.id} downloaded: ${result.videoPath}`);
    })
    .catch(async (err) => {
      console.error(`❌ Reel ${reel.id} download failed:`, err.message);
      await supabase
        .from("Reel")
        .update({ status: "failed" })
        .eq("id", reel.id);
    });

  // 3. Respond immediately — frontend will poll for status
  return NextResponse.json(reel, { status: 201 });
}
