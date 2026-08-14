import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/reels/[id]/comments — public
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reelId = parseInt(id);
  if (isNaN(reelId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { data: comments, error } = await supabase
    .from("Comment")
    .select("*")
    .eq("reelId", reelId)
    .order("createdAt", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments || []);
}

// POST /api/reels/[id]/comments — public (any user can comment)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reelId = parseInt(id);
  if (isNaN(reelId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const { text, author } = await req.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from("Comment")
    .insert({
      reelId,
      text: text.trim().slice(0, 300),
      author: (author?.trim() || "Anonymous").slice(0, 40),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
