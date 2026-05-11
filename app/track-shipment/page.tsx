"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";

// Helper fungsi tanggal format Australia (24 March 2026)
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

interface Tracking {
  connote_no: string;
  status: string;
  origin: string;
  destination: string;
  createdAt: string;
  history: {
    date: string;
    description: string;
    status: string;
    connote_no: string;
    user_inp: string;
    createdAt: string;
  }[];
}

export default function TrackShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const connoteNo = params.connoteNo as string;

  const [inputConnote, setInputConnote] = useState("");
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "delivered") return "bg-green-100 text-green-700";
    if (s === "delivery") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputConnote) return;
    router.push(`/track-shipment/${inputConnote}`);
  };

  useEffect(() => {
    if (connoteNo) {
      setInputConnote(connoteNo);
    }
  }, [connoteNo]);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/track/${connoteNo}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Tracking error:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (connoteNo) fetchTracking();
  }, [connoteNo]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />

      {/* Container utama: px-4 untuk mobile, px-16 untuk desktop */}
      <div className="py-6 px-4 md:px-16 max-w-[1600px] mx-auto">
        <div className="space-y-6">
          {/* 🔹 HEADER */}
          <div>
            <h1 className="text-2xl font-bold">Track Shipment</h1>
            <p className="text-gray-500 text-sm">
              Tracking Connote No:{" "}
              <span className="font-semibold">{connoteNo || "-"}</span>
            </p>
          </div>

          {/* 🔍 SEARCH FORM - Border diperbaiki agar tidak hilang di mobile */}
          <div className="bg-white p-4 rounded-2xl border border-gray-300 shadow-sm">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Connote Number..."
                value={inputConnote}
                onChange={(e) => setInputConnote(e.target.value)}
                className="w-full flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Track
              </button>
            </form>
          </div>

          {/* 📦 DATA SECTION */}
          {!loading && data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: SUMMARY & TIMELINE */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h2 className="font-semibold text-lg mb-4">
                    Shipment Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-gray-400 text-xs uppercase font-bold">
                        Connote
                      </p>
                      <p className="font-semibold break-all">
                        {data.connote_no}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-gray-400 text-xs uppercase font-bold">
                        Status
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStatusColor(data.status)}`}
                      >
                        {data.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-bold">
                        Origin
                      </p>
                      <p className="font-medium">{data.origin}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase font-bold">
                        Destination
                      </p>
                      <p className="font-medium">{data.destination}</p>
                    </div>
                  </div>
                </div>

                {/* TIMELINE VIEW (Visual) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h2 className="font-semibold mb-4">Live Status</h2>
                  <div className="space-y-6">
                    {data.history?.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${index === 0 ? "bg-blue-600 ring-4 ring-blue-100" : "bg-gray-300"}`}
                          />
                          {index !== data.history.length - 1 && (
                            <div className="w-[2px] flex-1 bg-gray-200 my-1" />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-sm ${index === 0 ? "font-bold" : "text-gray-600"}`}
                          >
                            {item.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: FULL LOGS TABLE */}
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <h2 className="font-semibold mb-4">Tracking Logs (System)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3 border-b">Status</th>
                          <th className="p-3 border-b">Description</th>
                          <th className="p-3 border-b">Date Time</th>
                          <th className="p-3 border-b">User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.history.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 text-gray-700">
                              {item.description}
                            </td>
                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="p-3 font-medium text-gray-600">
                              {item.user_inp}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                Data not found. Please enter a valid connote number.
              </div>
            )
          )}

          {loading && (
            <div className="text-center py-20 text-gray-400">
              Loading tracking data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
