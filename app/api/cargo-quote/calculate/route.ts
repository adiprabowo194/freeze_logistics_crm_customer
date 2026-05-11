import { ShippingRates, Carriers } from "@/models";
import { NextResponse, NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await getSessionUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerCode = user.customer_code;
    const { origin_state, dest_state, zone_type, cargos = [] } = body;

    // 1. Grouping Input Cargo berdasarkan Unit
    const groupedInput = cargos.reduce((acc: any, cargo: any) => {
      const unit = cargo.unit?.toLowerCase();
      if (unit) {
        acc[unit] = (acc[unit] || 0) + Number(cargo.qty || 0);
      }
      return acc;
    }, {});

    const requestedUnits = Object.keys(groupedInput);
    if (requestedUnits.length === 0) return NextResponse.json([]);

    // 2. Ambil semua rates yang cocok
    const allRates = await ShippingRates.findAll({
      where: {
        customer_code: customerCode,
        origin_state,
        dest_state,
        zone_type,
      },
      include: [
        {
          model: Carriers,
          as: "carrier_details",
          where: { is_active: 1 },
          required: true,
        },
      ],
    });

    // 3. Kelompokkan hasil query berdasarkan Carrier ID
    const ratesByCarrier: { [key: string]: any[] } = {};
    allRates.forEach((rate: any) => {
      const rateData = rate.get({ plain: true });
      const carrierId = rateData.carrier_details?.id;
      if (carrierId) {
        if (!ratesByCarrier[carrierId]) ratesByCarrier[carrierId] = [];
        ratesByCarrier[carrierId].push(rateData);
      }
    });

    const finalResults = [];

    // 4. Iterasi per kelompok Carrier
    for (const carrierId in ratesByCarrier) {
      const carrierRates = ratesByCarrier[carrierId];
      const carrierInfo = carrierRates[0].carrier_details;

      let totalExclTax = 0;
      let totalTaxAmount = 0;
      let breakdownDetails = [];
      let rateIdDetails = [];
      let canHandleAllRequestedUnits = true;

      for (const unitType of requestedUnits) {
        const qty = groupedInput[unitType];
        const matchRate = carrierRates.find(
          (r) => r.package_type?.toLowerCase() === unitType,
        );

        if (!matchRate) {
          canHandleAllRequestedUnits = false;
          break;
        }

        rateIdDetails.push({
          rate_id: matchRate.id,
          unit: unitType,
          qty: qty,
        });

        const fuelPct = Number(matchRate.margin_fuel_levy ?? 0) / 100;
        const marginPct = Number(matchRate.margin_percent ?? 0) / 100;
        const basePrice = Number(matchRate.carrier_price ?? 0);
        const taxPct = Number(matchRate.tax_percent ?? 0) / 100;

        let unitExclTax = 0;
        let firstUnitPrice = 0;
        let nextUnitPrice = 0;
        const unit_threshold = matchRate.unit_threshold ?? 1;

        // ============================================================
        // CHECK LOGIKA BOX & PALLET
        // ============================================================
        if (unitType === "pallet") {
          // Pallet: Rate = Base * (1 + Margin)
          firstUnitPrice = basePrice * (1 + marginPct);

          if (qty > unit_threshold) {
            // Next price Pallet (Bensin): Rate * Fuel%
            nextUnitPrice = firstUnitPrice * fuelPct;
            unitExclTax = firstUnitPrice + (qty - 1) * nextUnitPrice;
          } else {
            nextUnitPrice = 0;
            unitExclTax = firstUnitPrice;
          }
        } else {
          // Box: Sesuai Rumus Campuran Anda
          const nextPriceBase = Number(matchRate.next_price_carrier ?? 0);

          // First Unit: (19 * 1.55) * 1.05 = 30.92
          firstUnitPrice = basePrice * (1 + fuelPct) * (1 + marginPct);

          if (qty > unit_threshold) {
            // Next Unit: (6 * 1.55) + (1 + 0.05) = 10.35
            nextUnitPrice = nextPriceBase * (1 + fuelPct) + (1 + marginPct);
            unitExclTax = firstUnitPrice + (qty - 1) * nextUnitPrice;
          } else {
            nextUnitPrice = 0;
            unitExclTax = firstUnitPrice;
          }
        }

        const unitTax = unitExclTax * taxPct;
        totalExclTax += unitExclTax;
        totalTaxAmount += unitTax;

        breakdownDetails.push({
          cargoUnit: unitType,
          qty_total: qty,
          first_unit_price: parseFloat(firstUnitPrice.toFixed(2)),
          next_unit_price: parseFloat(nextUnitPrice.toFixed(2)),
          subtotal_excl_tax: parseFloat(unitExclTax.toFixed(2)),
          tax_amount: parseFloat(unitTax.toFixed(2)),
        });
      }

      if (canHandleAllRequestedUnits) {
        finalResults.push({
          rate_id: JSON.stringify(rateIdDetails),
          carrier_code: carrierInfo.carrier_code || "N/A",
          name: carrierInfo.carrier_name || "Unknown",
          price: parseFloat((totalExclTax + totalTaxAmount).toFixed(2)),
          price_excl_tax: parseFloat(totalExclTax.toFixed(2)),
          tax_amount: parseFloat(totalTaxAmount.toFixed(2)),
          breakdown: breakdownDetails,
          pickup_eta: "1 - 2",
          delivery_eta: "3 - 5",
          zone_type: zone_type,
        });
      }
    }

    finalResults.sort((a, b) => a.price - b.price);

    return NextResponse.json(finalResults);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
