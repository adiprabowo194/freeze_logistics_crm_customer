import { NextResponse } from "next/server";
import "@/models";
import bcrypt from "bcrypt";
import { Users } from "@/models";
import { Op } from "sequelize";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await Users.findOne({
      where: {
        email: email,
        role_id: { [Op.in]: [2] },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email or Password not found" },
        { status: 401 },
      );
    }

    const raw = user.get();

    // ========================
    // CEK PASSWORD
    // ========================
    const isMatch = await bcrypt.compare(password, raw.password || "");

    if (!isMatch) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    // 🔥 FORMAT SESSION (rapih)
    const sessionData = {
      email: user.getDataValue("email"),
      username: user.getDataValue("username"),
      customer_code: user.getDataValue("customer_code"),
      full_name: user.getDataValue("full_name"),
    };

    const response = NextResponse.json({
      success: true,
      message: "Login success",
    });

    // 🔥 SET COOKIE
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
