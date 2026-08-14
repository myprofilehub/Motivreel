export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth";
import { deleteVideoFiles } from "@/lib/downloader";

// DELETE /api/reels/[id] — admin only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reelId = parseInt(id);
  if (isNaN(reelId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { error } = await supabase.from("Reel").delete().eq("id", reelId);
  
  if (error) {
    return NextResponse.json({ error: "Reel not found or delete failed" }, { status: 404 });
  }
  
  deleteVideoFiles(reelId); // remove video + thumbnail from disk
  return NextResponse.json({ success: true });
}

// PATCH /api/reels/[id] — admin only (update title or order)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reelId = parseInt(id);
  const body = await req.json();

  const { data: updated, error } = await supabase
    .from("Reel")
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.order !== undefined && { order: body.order }),
    })
    .eq("id", reelId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
