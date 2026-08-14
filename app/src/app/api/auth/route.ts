import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, getAdminSession, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

// GET /api/auth — check session status
export async function GET() {
  const isAdmin = await getAdminSession();
  if (isAdmin) {
    return NextResponse.json({ authed: true });
  }
  return NextResponse.json({ authed: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const correctPin = process.env.ADMIN_PIN || "0000";

  if (pin !== correctPin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const token = await signAdminToken();

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
