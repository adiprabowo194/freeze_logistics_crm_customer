import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToExcel = async (data: any[], fileName: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Jobs Report");

  // 1. Definisi Kolom (Disesuaikan dengan field Model Quotes & Includes)
  worksheet.columns = [
    { header: "CONNOTE NO", key: "connote_no", width: 20 },
    { header: "DATE", key: "createdAt", width: 15 },
    { header: "CUSTOMER", key: "customer_code", width: 15 },
    { header: "CARRIER", key: "carrier_name", width: 20 },
    { header: "ORIGIN", key: "origin", width: 30 },
    { header: "DESTINATION", key: "destination", width: 30 },
    { header: "DESTINATION ADDRESS", key: "destination_address", width: 30 },
    { header: "RECEIVER", key: "receiver_name", width: 20 },
    { header: "RECEIVER PHONE", key: "receiver_phone", width: 20 },
    { header: "PICKUP DATE", key: "pickup_date", width: 20 },
    { header: "WEIGHT (KG)", key: "total_weight", width: 12 },
    { header: "QTY", key: "total_qty", width: 10 },
    { header: "PRICE ALL IN", key: "price_all_in", width: 15 },
    { header: "STATUS", key: "status", width: 15 },
    { header: "CARGO DETAILS", key: "package_info", width: 45 },
  ];

  // 2. Mapping Data
  data.forEach((item) => {
    // Gabungkan detail cargo dari PackageDetails
    const packageInfo =
      item.packageDetails && item.packageDetails.length > 0
        ? item.packageDetails
            .map((p: any) => `${p.qty}x ${p.unit} (${p.temperature})`)
            .join(" | ")
        : "-";

    worksheet.addRow({
      connote_no: item.connote_no,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-GB")
        : "-",
      customer_code: item.customer_code || "-",

      // Ambil carrier_name dari include carrierDetail
      carrier_name: item.carrierDetail?.carrier_name || item.carrier || "-",

      // Ambil dari include originArea & destinationArea
      origin:
        `${item.originArea.suburb}, ${item.originArea.state} ${item.originArea.postcode}` ||
        "-",

      destination:
        `${item.destinationArea.suburb}, ${item.destinationArea.state} ${item.destinationArea.postcode}` ||
        "-",

      destination_address: `${item.delivery_address}` || "-",

      receiver_name: item.receiver_name || "-",
      receiver_phone: item.receiver_phone || "-",
      pickup_date: item.pickup_date || "-",
      total_weight: item.total_weight || 0,
      total_qty: item.total_qty || 0,
      price_all_in: item.price_all_in || 0,
      status: item.status?.toUpperCase() || "PENDING",
      package_info: packageInfo,
    });
  });

  // 3. Styling Header
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2563EB" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // 4. Format Angka untuk kolom Harga (Opsional)
  worksheet.getColumn("price_all_in").numFmt = "#,##0.00";

  // 5. Generate & Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
};
