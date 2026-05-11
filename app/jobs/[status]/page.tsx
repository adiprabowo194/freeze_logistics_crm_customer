"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { exportToExcel } from "@/utils/exportToExcel";

// Hooks & Components
import useQuotes from "@/hooks/useQuotes";
import useSummary from "@/hooks/useSummary";
import useDebounce from "@/hooks/useDebounce";
import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";
import Pagination from "@/components/Pagination";
// 📦 TYPE
interface Quote {
  id: number;
  connote_no: string;
  status: string;
  createdAt: string;

  temperature?: string;
  unit?: string;
  qty?: number;
  weight?: number;

  originArea?: {
    suburb?: string;
  };

  destinationArea?: {
    suburb?: string;
  };
}

export default function QuotesByStatusPage() {
  const params = useParams();
  const statusParam = params.status as string;

  // 🔹 STATE
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [statusList, setStatusList] = useState<string[]>([
    "Booking",
    "Delivered",
    "Pickup",
    "Delivery",
    "Confirm",
  ]);
  const debouncedSearch = useDebounce(search);

  // 🔥 NORMALIZE STATUS (penting)
  const status =
    statusParam === "all"
      ? ""
      : statusParam === "onprocess"
        ? "onprocess"
        : statusParam;

  // 🔥 TABLE DATA
  const { data, totalPages, loading } = useQuotes({
    page,
    limit,
    search: debouncedSearch,
    status,
    statusList,
  });

  // 🔥 SUMMARY
  const { active, delivered, onprocess } = useSummary({
    search: debouncedSearch,
    status,
    statusList,
  });

  // 2. 🔥 Fungsi Export (Mengambil SEMUA data tanpa pagination)
  const handleExportAll = async () => {
    try {
      setIsExporting(true); // Mulai loading
      const response = await fetch(
        `/api/quotes?status=${statusParam}&search=${debouncedSearch}&limit=10000`,
      );
      const result = await response.json();
      const allData = result.data || [];

      if (allData.length > 0) {
        await exportToExcel(allData, `Freeze_Logistics_${statusParam}`);
      } else {
        alert("No data available to export");
      }
    } catch (error) {
      console.error("Export Error:", error);
    } finally {
      // Beri sedikit delay (misal 500ms) agar transisi UI lebih halus sebelum overlay hilang
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="relative bg-gray-50 min-h-screen">
      {isExporting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300 w-full max-w-xs md:max-w-sm">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
              <div className="absolute top-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">
                Preparing Excel File
              </h3>
              <p className="text-sm text-gray-500">
                Please wait, fetching all records...
              </p>
            </div>
          </div>
        </div>
      )}
      <TopNavbar />
      <MenuBars />

      {/* Container: Padding disesuaikan (p-4 di mobile, lg:px-16 di desktop) */}
      <div className="p-4 md:p-6 lg:px-16 max-w-[1400px] mx-auto">
        <div className="space-y-6 md:px-8">
          {/* 🔹 TITLE & BUTTON - Stack vertikal di mobile */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold capitalize">
                {statusParam} Quotes
              </h1>
              <p className="text-gray-500 text-sm">
                Filtered by status: {statusParam}
              </p>
            </div>

            {statusParam === "booking" && (
              <button
                onClick={handleExportAll}
                disabled={isExporting || loading}
                className={`${
                  isExporting
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-700"
                } text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 w-full md:w-auto`}
              >
                {isExporting ? (
                  <>
                    {" "}
                    <span className="animate-spin">🌀</span> Processing...{" "}
                  </>
                ) : (
                  <>📥 Export All to Excel</>
                )}
              </button>
            )}
          </div>

          {/* 🔍 SEARCH */}
          <div>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by connote / route..."
              className="w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            />
          </div>

          {/* 📊 SUMMARY - 2 Kolom di mobile agar tidak terlalu kecil */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl border p-4 text-center shadow-sm">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-bold tracking-wider">
                Total
              </p>
              <p className="text-lg md:text-xl font-bold">{active}</p>
            </div>

            <div className="bg-white rounded-2xl border p-4 text-center shadow-sm">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-bold tracking-wider">
                On Process
              </p>
              <p className="text-lg md:text-xl font-bold text-yellow-500">
                {onprocess}
              </p>
            </div>

            <div className="bg-white rounded-2xl border p-4 text-center shadow-sm col-span-2 md:col-span-1">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-bold tracking-wider">
                Delivered
              </p>
              <p className="text-lg md:text-xl font-bold text-green-500">
                {delivered}
              </p>
            </div>
          </div>

          {/* 📦 LIST - Diubah menjadi flex-col pada mobile */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-10">
                Loading...
              </p>
            ) : data.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400 text-sm">
                No data found
              </div>
            ) : (
              data.map((item: Quote) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl border p-5 flex flex-col md:flex-row justify-between gap-4 md:items-start shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* 💡 TOOLTIP UTAMA (Muncul saat kartu di-hover) */}
                  <div className="absolute -top-10 left-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 hidden md:block">
                    <div className="bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                      <i className="ri-information-line text-blue-300"></i>
                      Click for more details
                    </div>
                    {/* Segitiga Tooltip */}
                    <div className="w-2 h-2 bg-gray-800 rotate-45 ml-4 -mt-1"></div>
                  </div>

                  {/* LEFT: Info Identitas */}
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center md:block">
                      <p className="font-bold text-blue-600 md:text-black group-hover:text-blue-600 transition-colors">
                        {item.connote_no || "-"}
                      </p>
                      <span
                        className={`md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === "delivered"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {item.status || "-"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      📅{" "}
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "-"}
                    </p>
                    <p className="text-sm font-medium pt-1">
                      📍 {item.originArea?.suburb || "-"}{" "}
                      <span className="text-gray-400 px-1">→</span>{" "}
                      {item.destinationArea?.suburb || "-"}
                    </p>
                  </div>

                  {/* MIDDLE: Detail Cargo */}
                  <div className="grid grid-cols-2 md:block md:space-y-2 text-sm border-t md:border-0 pt-3 md:pt-0">
                    <div className="group/detail relative">
                      <p className="text-[10px] text-gray-400 uppercase font-bold md:hidden">
                        Temp
                      </p>
                      <p className="text-gray-600">{item.temperature || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold md:hidden">
                        Unit
                      </p>
                      <span className="text-blue-500 font-bold italic group-hover:underline transition-all">
                        {item.unit || "-"}
                      </span>
                    </div>
                  </div>

                  {/* MIDDLE: Weight & Qty */}
                  <div className="grid grid-cols-2 md:block text-sm md:space-y-1">
                    <p className="font-medium">📦 {item.weight || 0} kg</p>
                    <p className="text-gray-500">Qty: {item.qty || 0}</p>
                  </div>

                  {/* RIGHT: Actions & Desktop Status */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 border-t md:border-0 pt-4 md:pt-0">
                    <span
                      className={`hidden md:block px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                        item.status === "delivered"
                          ? "bg-green-100 text-green-600"
                          : item.status === "transit"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {item.status || "-"}
                    </span>

                    <div className="flex flex-row gap-2 w-full md:w-auto">
                      {/* Tombol Track dengan Pop-up Kecil */}
                      <div className="relative group/btn flex-1 md:flex-none">
                        <Link
                          href={`/track-shipment/${item.connote_no}`}
                          className="block border border-blue-500 text-blue-500 px-4 py-2 rounded-lg text-xs font-bold text-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          Track
                        </Link>
                        <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          Check Status
                        </span>
                      </div>

                      {/* Tombol Invoice dengan Pop-up Kecil */}
                      <div className="relative group/btn flex-1 md:flex-none">
                        <Link
                          href={`/invoice/${item.connote_no}`}
                          className="block bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold text-center hover:bg-black transition-all shadow-sm active:scale-95"
                        >
                          Invoice
                        </Link>
                        <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          View Billing
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 🔹 FOOTER (Limit & Pagination) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="border rounded-lg px-2 py-1 text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-500">entries</span>
            </div>
            <div className="w-full md:w-auto overflow-x-auto flex justify-center">
              <Pagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
