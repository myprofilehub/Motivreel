import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  try {
    await prisma.reel.delete({ where: { id: reelId } });
    deleteVideoFiles(reelId); // remove video + thumbnail from disk
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }
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

  try {
    const updated = await prisma.reel.update({
      where: { id: reelId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
