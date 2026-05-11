import { NextResponse } from "next/server";
const { Op } = require("sequelize");
import Users from "@/models/Users";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // ========================
    // CEK USER
    // ========================
    const user = await Users.findOne({
      where: {
        email: email,
        role_id: { [Op.in]: [2] },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email or Password not found1" },
        { status: 401 },
      );
    }

    const raw = user.get();

    // ========================
    // CEK PASSWORD
    // ========================
    const isMatch = await bcrypt.compare(password, raw.password || "");

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Email or Password not found!" },
        { status: 401 },
      );
    }

    // ========================
    // CEK STATUS USER
    // ========================
    if (raw.status !== 1) {
      return NextResponse.json(
        { success: false, message: "User tidak aktif" },
        { status: 403 },
      );
    }

    // ========================
    // SET SESSION COOKIE
    // ========================
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
    });

    response.cookies.set(
      "session",
      JSON.stringify({
        id: raw.id,
        email: raw.email,
      }),
      {
        httpOnly: true,
        path: "/",
      },
    );

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
