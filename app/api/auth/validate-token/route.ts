import { NextResponse } from "next/server";
import "@/models";
import { Users } from "@/models";

export async function POST(req: Request) {
  const { token, email } = await req.json();

  console.log([token, email]);
  const user = await Users.findOne({
    where: {
      email,
      reset_token: token,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  }

  const expired = user.getDataValue("reset_token_expired");

  // return NextResponse.json(new Date() > new Date(expired));
  // if (!expired || new Date() > new Date(expired)) {
  //   return NextResponse.json({ error: "Token expired" }, { status: 400 });
  // }

  return NextResponse.json({ valid: true });
}
