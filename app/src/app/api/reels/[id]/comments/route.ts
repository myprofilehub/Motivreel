import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reels/[id]/comments — public
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reelId = parseInt(id);
  if (isNaN(reelId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { reelId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(comments);
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

  const comment = await prisma.comment.create({
    data: {
      reelId,
      text: text.trim().slice(0, 300),
      author: (author?.trim() || "Anonymous").slice(0, 40),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
