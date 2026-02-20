import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
