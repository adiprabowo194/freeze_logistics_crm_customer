import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout Success",
  });

  // ❌ hapus session cookie
  response.cookies.set("session", "", {
    httpOnly: true,
    expires: new Date(0), // langsung expired
    path: "/",
  });

  return response;
}
