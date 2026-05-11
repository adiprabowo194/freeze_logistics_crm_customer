"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 🔹 Import useRouter
import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";
import { exportToExcel } from "@/utils/exportToExcel";

import useQuotes from "@/hooks/useQuotes";
import useSummary from "@/hooks/useSummary";
import useDebounce from "@/hooks/useDebounce";
import Link from "next/link";
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
  originArea?: { suburb?: string };
  destinationArea?: { suburb?: string };
}

export default function QuotesPage() {
  const router = useRouter(); // 🔹 Initialize router
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebounce(search);
  const [isExporting, setIsExporting] = useState(false);
  const [statusList] = useState<string[]>([
    "Booking",
    "Delivered",
    "Pickup",
    "Delivery",
    "Confirm",
  ]);

  const { data, totalPages, loading } = useQuotes({
    page,
    limit,
    search: debouncedSearch,
    status,
    statusList,
  });

  const { active, delivered, onprocess } = useSummary({
    search: debouncedSearch,
    statusList,
  });

  const handleExportAll = async () => {
    try {
      setIsExporting(true);
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
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />

      <div className="p-4 md:p-6 lg:px-16">
        <div className="mb-6 md:px-8 space-y-6">
          {/* TITLE & EXPORT */}
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
              className={`${isExporting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"} text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 w-full md:w-auto`}
            >
              {isExporting ? "🌀 Processing..." : "📥 Export All to Excel"}
            </button>
          </div>

          {/* SEARCH */}
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search connote / origin / destination..."
            className="w-full px-4 py-3 rounded-xl border bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* SUMMARY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border p-4 text-center">
              <p className="text-gray-500 text-[10px] uppercase font-semibold">
                Total Bookings
              </p>
              <p className="text-lg font-bold">{active}</p>
            </div>
            <div className="bg-white rounded-2xl border p-4 text-center">
              <p className="text-gray-500 text-[10px] uppercase font-semibold">
                On Process
              </p>
              <p className="text-lg font-bold text-yellow-500">{onprocess}</p>
            </div>
            <div className="bg-white rounded-2xl border p-4 text-center">
              <p className="text-gray-500 text-[10px] uppercase font-semibold">
                Delivered
              </p>
              <p className="text-lg font-bold text-green-500">{delivered}</p>
            </div>
            <div className="bg-white rounded-2xl border p-4 text-center">
              <p className="text-gray-500 text-[10px] uppercase font-semibold">
                Total Data
              </p>
              <p className="text-lg font-bold">{data.length}</p>
            </div>
          </div>

          {/* LIST */}
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
                <Link
                  key={item.id || item.connote_no}
                  href={`/jobs/detail/${item.connote_no}`}
                  className="block"
                >
                  <div className="group relative bg-white rounded-2xl border border-gray-100 p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4 md:gap-6 md:items-center shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 mb-4">
                    {/* 1. SECTION: IDENTITAS & ROUTE */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Connote No
                          </p>
                          <p className="font-extrabold text-base md:text-lg text-blue-600 md:text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {item.connote_no || "-"}
                          </p>
                        </div>
                        {/* Status Mobile Only - Posisikan di pojok kanan atas */}
                        <span
                          className={`md:hidden px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tight whitespace-nowrap ${
                            item.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.status || "Booking"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-gray-500 bg-gray-50 p-2 rounded-lg w-full md:w-fit">
                        <span className="whitespace-nowrap">
                          📅 {formatDate(item.createdAt)}
                        </span>
                        <span className="hidden sm:inline text-gray-300">
                          |
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-gray-700 truncate">
                          <i className="ri-map-pin-2-fill text-red-400"></i>
                          <span className="truncate max-w-[80px] sm:max-w-none">
                            {item.originArea?.suburb || "-"}
                          </span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="truncate max-w-[80px] sm:max-w-none">
                            {item.destinationArea?.suburb || "-"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* 2. SECTION: CARRIER */}
                    <div className="flex items-center gap-3 md:flex-col md:justify-center px-4 py-3 md:py-2 border-l-4 border-blue-500 bg-blue-50/30 md:bg-transparent md:border-l-0 md:border-x md:border-gray-100 min-w-0 md:min-w-[140px]">
                      <div className="h-10 w-16 md:h-12 md:w-24 flex items-center justify-center shrink-0">
                        <img
                          src={`https://admin.freezelogistics.com.au/${item.carrierDetail?.image_path}`}
                          alt="Logo"
                          className="object-contain max-h-full max-w-full drop-shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://admin.freezelogistics.com.au/assets/carrier_logo/default.webp`;
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 font-black uppercase leading-none mb-1">
                          Carrier
                        </p>
                        <p className="text-xs md:text-[11px] font-bold text-gray-700 truncate max-w-[150px] md:max-w-[120px]">
                          {item.carrierDetail?.carrier_name || "SLR TRANS"}
                        </p>
                      </div>
                    </div>

                    {/* 3. SECTION: CARGO DETAILS */}
                    <div className="grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-1 text-left min-w-0 md:min-w-[110px]">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">
                          Temp
                        </p>
                        <p
                          className={`text-[11px] font-bold ${item.temperature?.toLowerCase().includes("frozen") ? "text-blue-500" : "text-orange-500"}`}
                        >
                          {item.temperature || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">
                          Cargo
                        </p>
                        <p className="text-[11px] font-bold text-gray-800 whitespace-nowrap">
                          📦 {item.weight}kg{" "}
                          <span className="text-gray-400 font-normal">
                            ({item.qty} {item.unit})
                          </span>
                        </p>
                      </div>
                      {/* Status Desktop Only */}
                      <div className="hidden md:block pt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
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
                    <div className="flex gap-2 pt-3 border-t border-dashed border-gray-200 md:border-0 md:pt-0 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/track-shipment/${item.connote_no}`);
                        }}
                        className="flex-1 md:flex-none bg-white border-2 border-blue-600 text-blue-600 px-4 md:px-5 py-2 rounded-xl text-[11px] font-black hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        TRACK
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/invoice/${item.connote_no}`);
                        }}
                        className="flex-1 md:flex-none bg-gray-900 text-white px-4 md:px-5 py-2 rounded-xl text-[11px] font-black hover:bg-black transition-all active:scale-95 shadow-md"
                      >
                        INVOICE
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* FOOTER */}
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
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
