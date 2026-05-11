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
  carrierDetail: {
    carrier_name?: string;
    carrier_code?: string;
    image_path?: string;
  };

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
                <Link
                  key={item.id}
                  href={`/jobs/detail/${item.connote_no}`}
                  className="block"
                >
                  <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row justify-between gap-6 md:items-center shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 mb-4">
                    {/* 1. SECTION: IDENTITAS & ROUTE */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start md:items-center">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Connote No
                          </p>
                          <p className="font-extrabold text-lg text-blue-600 md:text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.connote_no || "-"}
                          </p>
                        </div>
                        {/* Status Mobile Only */}
                        <span
                          className={`md:hidden px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                            item.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.status || "Booking"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg w-fit">
                        <span>📅 {formatDate(item.createdAt) || "-"}</span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <i className="ri-map-pin-2-fill text-red-400"></i>{" "}
                          {item.originArea?.suburb || "-"}
                          <span className="text-gray-400 mx-1">→</span>
                          {item.destinationArea?.suburb || "-"}
                        </span>
                      </div>
                    </div>

                    {/* 2. SECTION: CARRIER (Logo di atas teks agar tidak tabrakan) */}
                    <div className="flex flex-row items-start md:items-center justify-center px-4 py-2 border-l-4 border-blue-500 bg-blue-50/30 md:bg-transparent md:border-l-0 md:border-x md:border-gray-100 min-w-[140px]">
                      <div className="h-14 md:w-28 w-24 flex items-center justify-start md:justify-center mb-1">
                        <img
                          src={`https://admin.freezelogistics.com.au/${item.carrierDetail?.image_path}`}
                          alt="Carrier Logo"
                          className="object-contain max-h-full max-w-full drop-shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://admin.freezelogistics.com.au/assets/carrier_logo/default.webp`;
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="md:text-[9px] text-base text-gray-400 font-black uppercase">
                          Carrier
                        </p>
                        <p className="md:text-[11px] text-xl font-bold text-gray-700 truncate max-w-[120px]">
                          {item.carrierDetail?.carrier_name || "SLR TRANS"}
                        </p>
                      </div>
                    </div>

                    {/* 3. SECTION: CARGO DETAILS */}
                    <div className="grid grid-cols-3 md:flex md:flex-col gap-4 md:gap-1 text-center md:text-left min-w-[100px]">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">
                          Temp
                        </p>
                        <p
                          className={`text-xs font-bold ${item.temperature?.toLowerCase().includes("frozen") ? "text-blue-500" : "text-orange-500"}`}
                        >
                          {item.temperature || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">
                          Cargo
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          📦 {item.weight || 0}kg{" "}
                          <span className="text-gray-400 font-normal">
                            ({item.qty} {item.unit})
                          </span>
                        </p>
                      </div>
                      {/* Status Desktop Only */}
                      <div className="hidden md:block pt-1">
                        <span
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                            item.status === "delivered"
                              ? "bg-green-50 text-green-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          ● {item.status || "Booking"}
                        </span>
                      </div>
                    </div>

                    {/* 4. SECTION: ACTIONS */}
                    <div className="flex gap-2 pt-4 border-t border-dashed md:border-0 md:pt-0">
                      <Link
                        href={`/track-shipment/${item.connote_no}`}
                        className="flex-1 md:flex-none bg-white border-2 border-blue-600 text-blue-600 px-5 py-2 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-center"
                      >
                        TRACK
                      </Link>
                      <Link
                        href={`/invoice/${item.connote_no}`}
                        className="flex-1 md:flex-none bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-black transition-all active:scale-95 text-center shadow-lg shadow-gray-200"
                      >
                        INVOICE
                      </Link>
                    </div>
                  </div>
                </Link>
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
