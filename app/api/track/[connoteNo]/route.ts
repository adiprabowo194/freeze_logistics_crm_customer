import { NextResponse } from "next/server";
import "@/models"; // 🔥 init relations

import TrackingHistory from "@/models/TrackingHistory";
import Quotes from "@/models/Quotes";
import CoverageAreas from "@/models/CoverageAreas";
import PackageDetails from "@/models/PackageDetail"; // ✅ tambah ini

export async function GET(
  req: Request,
  context: { params: Promise<{ connoteNo: string }> },
) {
  try {
    const { connoteNo } = await context.params;

    const rows = await TrackingHistory.findAll({
      where: { connote_no: connoteNo },
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: Quotes,
          as: "quote",
          include: [
            {
              model: CoverageAreas,
              as: "originArea",
              attributes: ["suburb", "state", "postcode"],
            },
            {
              model: CoverageAreas,
              as: "destinationArea",
              attributes: ["suburb", "state", "postcode"],
            },
            {
              model: PackageDetails,
              as: "packageDetails", // ✅ HARUS sama dengan relasi
              attributes: ["temperature", "unit", "qty", "weight"],
              required: false,

              // 🔥 ambil 1 saja (default)
              separate: true,
              limit: 1,
              order: [["createdAt", "DESC"]],
            },
          ],
        },
      ],
    });

    if (!rows || rows.length === 0) {
      return NextResponse.json(null);
    }

    const last = rows[rows.length - 1];
    const quote = last.get("quote") as any;

    // 🔥 ambil package detail pertama
    const firstDetail = quote?.packageDetails?.[0] || null;

    const result = {
      connote_no: connoteNo,
      status: last.get("status"),

      origin: quote?.originArea
        ? `${quote.originArea.suburb}, ${quote.originArea.state}, ${quote.originArea.postcode}`
        : "-",

      destination: quote?.destinationArea
        ? `${quote.destinationArea.suburb}, ${quote.destinationArea.state}, ${quote.destinationArea.postcode}`
        : "-",

      // 🔥 ambil dari packageDetails
      temperature: firstDetail?.temperature || "-",
      unit: firstDetail?.unit || "-",

      // optional
      weight: firstDetail?.weight || quote?.weight || 0,
      qty: firstDetail?.qty || quote?.qty || 0,
      receiver_name: quote?.receiver_name || 0,

      history: rows.map((row: any) => ({
        connote_no: row.get("connote_no"),
        status: row.get("status"),
        description: row.get("description"),
        createdAt: row.get("createdAt"),
        updatedAt: row.get("updatedAt"),
        user_inp: row.get("user_inp"),
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch tracking data" },
      { status: 500 },
    );
  }
}
