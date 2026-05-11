import { NextResponse } from "next/server";
import { connectDB } from "@/lib/sequelize";
// ❌ JANGAN IMPORT LANGSUNG: import Quotes from "@/models/Quotes";
// ✅ IMPORT DARI INDEX MODELS (Agar initRelations() dijalankan)
import { Quotes } from "@/models";
import { Op } from "sequelize";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectDB();

    const user = await getSessionUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerCode = user.customer_code;
    if (!customerCode) {
      return NextResponse.json(
        { error: "customer_code not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search") || "";

    // 1. Bangun Object Where
    const where: any = { customer_code: customerCode };

    // 🔍 Search Filter (Membutuhkan Relasi originArea & destinationArea)
    if (search) {
      where[Op.or] = [
        { connote_no: { [Op.like]: `%${search}%` } },
        { "$originArea.suburb$": { [Op.like]: `%${search}%` } },
        { "$destinationArea.suburb$": { [Op.like]: `%${search}%` } },
      ];
    }

    // 📅 Date Filter
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),
          new Date(`${endDate}T23:59:59`),
        ],
      };
    }

    // 🔗 Definisi Include (Wajib agar alias originArea & destinationArea dikenali)
    const include = [
      { association: "originArea", attributes: [] },
      { association: "destinationArea", attributes: [] },
    ];

    // 🚀 Execute Counts secara paralel
    const [total, delivered, onprocess] = await Promise.all([
      Quotes.count({
        where: { ...where, status: "booking" },
        include,
        distinct: true,
      }),
      Quotes.count({
        where: { ...where, status: "delivered" },
        include,
        distinct: true,
      }),
      Quotes.count({
        where: {
          ...where,
          status: { [Op.in]: ["booking", "transit", "approve"] },
        },
        include,
        distinct: true,
      }),
    ]);

    return NextResponse.json({
      active: total,
      delivered,
      onprocess,
    });
  } catch (error: any) {
    console.error("Summary API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
