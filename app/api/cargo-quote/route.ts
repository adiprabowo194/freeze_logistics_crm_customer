import { NextRequest, NextResponse } from "next/server";
import { sequelize } from "@/lib/sequelize";
import Quotes from "@/models/Quotes";
import PackageDetails from "@/models/PackageDetail";
import { getSessionUser } from "@/lib/auth";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(req: NextRequest) {
  const t = await sequelize.transaction();

  try {
    const body = await req.json();

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

    const {
      suburb_origin,
      suburb_destination,
      pickup_address,
      delivery_address,
      receiver_name,
      receiver_phone,
      cargos,
      total_qty,
      total_weight,
      total_cbm,
      carrier,
      status,
      pickupDate,
      delivery_eta,
      pickup_eta,
      price_all_in,
      carrier_price,
      rate_id,
    } = body;

    // 🔥 VALIDASI
    if (!suburb_origin || !suburb_destination) {
      throw new Error("Suburb wajib diisi");
    }

    if (!cargos || cargos.length === 0) {
      throw new Error("Cargo tidak boleh kosong");
    }

    // 🔥 generate connote
    const connote_no = `CN${Date.now()}`;

    // ================= INSERT QUOTES =================
    const newQuote = await Quotes.create(
      {
        connote_no,
        suburb_origin,
        suburb_destination,
        pickup_address,
        delivery_address,
        receiver_name,
        receiver_phone,
        total_qty,
        total_weight,
        total_cbm,
        carrier: carrier,
        pickup_date: pickupDate,
        eta_pickup: pickup_eta,
        eta_delivery: delivery_eta,
        price_all_in,
        carrier_price,
        rate_id: rate_id,
        customer_code: customerCode,
        user_inp: user.username,
        status,
        is_active: 1,
      },
      { transaction: t },
    );

    // ================= INSERT PACKAGE DETAILS =================
    const detailPayload = cargos.map((c: any) => ({
      connote_no,
      temperature: c.temperature,
      unit: c.unit,
      qty: c.qty,
      weight: c.weight,
      length: c.length,
      width: c.width,
      height: c.height,
      user_inp: user.username,
    }));

    await PackageDetails.bulkCreate(detailPayload, {
      transaction: t,
    });

    // ================= SEND EMAIL =================

    await resend.emails.send({
      from: "Freeze Logistics <no-reply@freezelogistics.com.au>",
      to: process.env.EMAIL_QUOTE_SENDING
        ? [process.env.EMAIL_QUOTE_SENDING]
        : ["admin@freezelogistics.com.au"],
      subject: `Job Order , Connote No :  ${connote_no}`,
      html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
              <h2 style="color:#3b82f6; margin-bottom: 20px;">New Quote from Customer 🚀</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Connote No</td><td>: ${connote_no || "-"}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Pickup</td><td>: ${pickup_address || "-"}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Pickup Date</td><td style="color: #3b82f6; font-weight: bold;">: ${pickupDate}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Receiver Destination</td><td>: ${delivery_address || "-"}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Carrier</td><td>: ${carrier || "-"}</td></tr>
                  </table>
             
            </div>
          `,
    });

    await t.commit();

    return NextResponse.json(
      {
        message: "Quote created successfully",
        data: {
          quote: newQuote,
          details: detailPayload,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    await t.rollback();

    console.error(error);

    return NextResponse.json(
      { message: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
