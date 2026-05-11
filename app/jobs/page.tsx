"use client";

import { useState } from "react";

import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";
import { exportToExcel } from "@/utils/exportToExcel";

import useQuotes from "@/hooks/useQuotes";
import useSummary from "@/hooks/useSummary";
import useDebounce from "@/hooks/useDebounce";
import Link from "next/link";
import Pagination from "@/components/Pagination";
// 📦 TYPE (pakai JOIN)
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
export default function QuotesPage() {
  // 🔹 STATE
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search);
  const [isExporting, setIsExporting] = useState(false);
  const [statusList, setStatusList] = useState<string[]>([
    "Booking",
    "Delivered",
    "Pickup",
    "Delivery",
    "Confirm",
  ]);
  // 🔥 FETCH TABLE

  // 🔥 TABLE DATA
  const { data, totalPages, loading } = useQuotes({
    page,
    limit,
    search: debouncedSearch,
    status,
    statusList,
  });

  // 🔥 FETCH SUMMARY
  const { active, delivered, onprocess } = useSummary({
    search: debouncedSearch,
    statusList,
  });

  // 2. 🔥 Fungsi Export (Mengambil SEMUA data tanpa pagination)
  const handleExportAll = async () => {
    try {
      setIsExporting(true); // Mulai loading
      const response = await fetch(
        `/api/quotes?search=${debouncedSearch}&limit=10000`,
      );
      const result = await response.json();
      const allData = result.data || [];

      if (allData.length > 0) {
        await exportToExcel(allData, `Freeze_Logistics_All_Job`);
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
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />

      {/* 🔥 CONTENT - Adjusted padding for mobile */}
      <div className="p-4 md:p-6 lg:px-16">
        <div className="mb-6 md:px-8 space-y-6">
          {/* 🔹 TITLE & EXPORT - Flex Column on mobile */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">List Jobs</h1>
              <p className="text-gray-500 text-sm">
                View and manage all your shipments
              </p>
            </div>
            <button
              onClick={handleExportAll}
              disabled={isExporting || loading}
              className={`${
                isExporting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              } text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 w-full md:w-auto`}
            >
              {isExporting ? "🌀 Processing..." : "📥 Export All to Excel"}
            </button>
          </div>

          {/* 🔍 SEARCH */}
          <div>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search connote / origin / destination..."
              className="w-full px-4 py-3 rounded-xl border bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 📊 SUMMARY - Grid 2 columns on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border p-4 md:p-5 text-center">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-semibold">
                Total Bookings
              </p>
              <p className="text-lg md:text-xl font-bold">{active}</p>
            </div>
            <div className="bg-white rounded-2xl border p-4 md:p-5 text-center">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-semibold">
                On Process
              </p>
              <p className="text-lg md:text-xl font-bold text-yellow-500">
                {onprocess}
              </p>
            </div>
            <div className="bg-white rounded-2xl border p-4 md:p-5 text-center">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-semibold">
                Delivered
              </p>
              <p className="text-lg md:text-xl font-bold text-green-500">
                {delivered}
              </p>
            </div>
            <div className="bg-white rounded-2xl border p-4 md:p-5 text-center">
              <p className="text-gray-500 text-[10px] md:text-sm uppercase font-semibold">
                Total Data
              </p>
              <p className="text-lg md:text-xl font-bold">{data.length}</p>
            </div>
          </div>

          {/* 📦 LIST - Responsive Card */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-10">
                Loading...
              </p>
            ) : data.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">
                No data found
              </p>
            ) : (
              data.map((item: Quote) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border p-5 flex flex-col md:flex-row justify-between gap-4 md:items-center"
                >
                  {/* LEFT: Info Utama */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center md:block">
                      <p className="font-bold text-blue-600 md:text-black">
                        {item.connote_no || "-"}
                      </p>
                      {/* Status badge show on mobile header */}
                      <span
                        className={`md:hidden px-3 py-1 rounded-full text-[10px] uppercase font-bold ${
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
                    <p className="text-sm font-medium">
                      📍 {item.originArea?.suburb || "-"}{" "}
                      <span className="text-gray-400">→</span>{" "}
                      {item.destinationArea?.suburb || "-"}
                    </p>
                  </div>

                  {/* MIDDLE: Detail Cargo - Grid on mobile */}
                  <div className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-8 text-sm border-t md:border-0 pt-4 md:pt-0">
                    <div className="space-y-1">
                      <p className="text-gray-400 text-[10px] uppercase font-bold">
                        Temperature
                      </p>
                      <p className="font-medium">{item.temperature || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-[10px] uppercase font-bold">
                        Unit
                      </p>
                      <span className="text-blue-600 font-bold italic">
                        {item.unit || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-[10px] uppercase font-bold">
                        Weight
                      </p>
                      <p className="font-medium">📦 {item.weight || 0} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-[10px] uppercase font-bold">
                        Quantity
                      </p>
                      <p className="font-medium">Qty: {item.qty || 0}</p>
                    </div>
                  </div>

                  {/* RIGHT: Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 border-t md:border-0 pt-4 md:pt-0">
                    <span
                      className={`hidden md:block px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === "delivered"
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {item.status || "-"}
                    </span>
                    <div className="flex flex-row gap-2 w-full">
                      <Link
                        href={`/track-shipment/${item.connote_no}`}
                        className="flex-1 text-center border border-blue-500 text-blue-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
                      >
                        Track
                      </Link>
                      <Link
                        href={`/invoice/${item.connote_no}`}
                        className="flex-1 text-center bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition"
                      >
                        Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 🔹 FOOTER (Limit & Pagination) - Wrap on mobile */}
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
