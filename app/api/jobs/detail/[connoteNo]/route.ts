// app/api/jobs/detail/[connoteNo]/route.ts
import { NextResponse } from "next/server";
import {
  Quotes,
  CoverageAreas,
  PackageDetails,
  Carriers,
  Customers,
} from "@/models/index";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ connoteNo: string }> }, // 1. Ubah tipe menjadi Promise
) {
  try {
    // 2. Unpack params menggunakan await
    const resolvedParams = await params;
    const connoteNo = resolvedParams.connoteNo;

    const data = await Quotes.findOne({
      where: { connote_no: connoteNo },
      include: [
        { model: CoverageAreas, as: "originArea" },
        { model: CoverageAreas, as: "destinationArea" },
        { model: PackageDetails, as: "packageDetails" },
        { model: Carriers, as: "carrierDetail" },
        { model: Customers, as: "customerQuote" },
      ],
    });

    if (!data) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
