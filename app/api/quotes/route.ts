import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { connectDB } from "@/lib/sequelize";
import { getSessionUser } from "@/lib/auth";

// 🔥 load relation
import "@/models";
import {
  Quotes as Booking,
  CoverageAreas,
  PackageDetails,
  Carriers,
} from "@/models";

export async function GET(req: Request) {
  try {
    await connectDB();

    // ================= SESSION =================
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerCode = user.customer_code;

    if (!customerCode) {
      return NextResponse.json(
        { error: "customer_code not found in session" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 5);
    const offset = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      customer_code: customerCode,
      is_active: 1,
    };

    // 🔍 SEARCH (FIX JOIN RELATION)
    if (search) {
      where[Op.or] = [
        { connote_no: { [Op.like]: `%${search}%` } },

        // 🔥 JOIN originArea
        { "$originArea.suburb$": { [Op.like]: `%${search}%` } },

        // 🔥 JOIN destinationArea
        { "$destinationArea.suburb$": { [Op.like]: `%${search}%` } },
      ];
    }

    // 📌 STATUS
    // if (status) {
    //   if (status === "onprocess") {
    //     where.status = {
    //       [Op.in]: ["booking", "transit", "approve"],
    //     };
    //   } else if (status === "confirm") {
    //     where.status = {
    //       [Op.in]: ["approve"],
    //     };
    //   } else if (status === "transit") {
    //     where.status = {
    //       [Op.in]: ["transit"],
    //     };
    //   } else if (status === "booking") {
    //     where.status = {
    //       [Op.in]: ["booking"],
    //     };
    //   } else {
    //     where.status = status;
    //   }
    // }
    // 📌 STATUS PRIORITY: multi > single
    const statusList = searchParams.get("statusList");
    if (statusList && !status) {
      where.status = {
        [Op.in]: statusList.split(","),
      };
    } else if (status) {
      if (status === "onprocess") {
        where.status = {
          [Op.in]: ["booking", "transit", "approve"],
        };
      } else if (status === "confirm") {
        where.status = {
          [Op.in]: ["approve"],
        };
      } else if (status === "transit") {
        where.status = {
          [Op.in]: ["transit"],
        };
      } else if (status === "booking") {
        where.status = {
          [Op.in]: ["booking"],
        };
      } else {
        where.status = status;
      }
    }
    // 📅 DATE
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + "T23:59:59")],
      };
    }

    // ================= QUERY =================
    const result = await Booking.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],

      include: [
        {
          model: CoverageAreas,
          as: "originArea",
          attributes: ["suburb", "state", "postcode", "zone_type"],
          required: false,
        },
        {
          model: Carriers,
          as: "carrierDetail",
          attributes: ["carrier_name", "carrier_code", "image_path"],
          required: false,
        },
        {
          model: CoverageAreas,
          as: "destinationArea",
          attributes: ["suburb", "state", "postcode", "zone_type"],
          required: false,
        },
        {
          model: PackageDetails,
          as: "packageDetails",
          attributes: [
            "temperature",
            "unit",
            "qty",
            "weight",
            "length",
            "width",
            "height",
          ],
          required: false,

          // 🔥 ambil 1 saja untuk default dropdown
          separate: true,
          // limit: 1,
          order: [["createdAt", "DESC"]],
        },
      ],

      raw: false,
      nest: true,
    });

    // ================= FORMAT =================
    const rows = result.rows.map((item: any) => {
      const data = item.toJSON();
      const firstDetail = data.packageDetails?.[0] || null;

      return {
        ...data,

        // 🔥 default select value
        temperature: firstDetail?.temperature || null,
        unit: firstDetail?.unit || null,

        // optional
        qty: firstDetail?.qty || null,
        weight: firstDetail?.weight || null,
      };
    });

    // ================= RESPONSE =================
    return NextResponse.json({
      data: rows,
      total: result.count,
      page,
      totalPages: Math.ceil(result.count / limit),
    });
  } catch (error: any) {
    console.error("🔥 API ERROR FULL:", error);

    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
