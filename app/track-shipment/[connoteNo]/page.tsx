"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";

// ================= TYPES =================
interface TrackingHistoryItem {
  connote_no: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  user_inp: string;
}

interface Tracking {
  connote_no: string;
  status: string;
  origin: string;
  destination: string;
  weight: number;
  qty: number;
  temperature: string;
  unit: string;
  history: TrackingHistoryItem[];
}

export default function TrackShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const connoteNo = params.connoteNo as string;

  const [inputConnote, setInputConnote] = useState("");
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "text-green-600 bg-green-50";
      case "delivery":
      case "in transit":
        return "text-blue-600 bg-blue-50";
      case "confirm":
      case "picked up":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-100";
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputConnote.trim()) return;
    router.push(`/track-shipment/${inputConnote}`);
  };

  useEffect(() => {
    if (connoteNo) setInputConnote(connoteNo);
  }, [connoteNo]);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/track/${connoteNo}`);
        if (!res.ok) throw new Error("Failed fetch");
        const result = await res.json();
        if (!result) {
          setData(null);
          setError("Tracking number not found");
        } else {
          setData(result);
        }
      } catch (err) {
        setError("Something went wrong");
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

      {/* Container utama: px-4 di mobile agar tidak mepet, md:px-16 di desktop */}
      <div className="p-4 md:p-6 md:px-16 space-y-6 max-w-[1600px] mx-auto">
        {/* 🔍 SEARCH BOX */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-2 md:gap-3">
            <input
              type="text"
              placeholder="Enter Connote Number..."
              value={inputConnote}
              onChange={(e) => setInputConnote(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            />
            <button
              type="submit"
              disabled={!inputConnote}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow hover:bg-blue-700 disabled:bg-gray-300 whitespace-nowrap"
            >
              Track
            </button>
          </form>
        </div>

        {/* TITLE */}
        <div className="px-1">
          <h1 className="text-xl md:text-2xl font-bold">Track Shipment</h1>
          <p className="text-gray-500 text-sm">
            Tracking Connote No:{" "}
            <span className="font-semibold break-all">{connoteNo}</span>
          </p>
        </div>

        {loading && (
          <div className="bg-white p-10 rounded-xl border animate-pulse text-center text-gray-400">
            Loading tracking data...
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* ROW 1: Details & Timeline */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* LEFT SUMMARY */}
              <div className="bg-white p-6 rounded-2xl border w-full lg:w-1/3 shadow-sm">
                <div className="space-y-4 text-sm">
                  <h2 className="font-bold text-lg border-b pb-2">
                    Shipment Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Connote
                      </p>
                      <p className="font-bold break-all text-gray-800">
                        {data.connote_no}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Status
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mt-1 ${getStatusColor(data.status)}`}
                      >
                        {data.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Origin
                      </p>
                      <p className="font-semibold text-gray-700">
                        {data.origin}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                        Destination
                      </p>
                      <p className="font-semibold text-gray-700">
                        {data.destination}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT TIMELINE */}
              <div className="w-full lg:w-2/3">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h2 className="font-bold text-lg mb-6 border-b pb-2">
                    Tracking History
                  </h2>
                  <div className="space-y-6 relative ml-1">
                    {[...data.history].reverse().map((item, index) => (
                      <div key={index} className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div
                            className={`z-10 w-3 h-3 rounded-full ${index === 0 ? "bg-blue-600 ring-4 ring-blue-100" : "bg-gray-300"}`}
                          />
                          {index !== data.history.length - 1 && (
                            <div className="w-[2px] flex-1 bg-gray-100 my-1" />
                          )}
                        </div>
                        <div className="pb-2">
                          <p
                            className={`text-sm leading-tight ${index === 0 ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}
                          >
                            {item.description}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Shipment Info & Logs */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* SHIPMENT INFO */}
              <div className="bg-white p-6 rounded-2xl border w-full lg:w-1/3 shadow-sm">
                <h2 className="font-bold text-lg mb-4 border-b pb-2">
                  Shipment Info
                </h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    {
                      label: "Weight",
                      val: `${data.weight} kg`,
                      color: "text-blue-600",
                    },
                    { label: "Quantity", val: data.qty },
                    { label: "Temperature", val: data.temperature },
                    { label: "Unit", val: data.unit },
                  ].map((info, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100"
                    >
                      <p className="text-gray-400 text-[9px] uppercase font-bold">
                        {info.label}
                      </p>
                      <p
                        className={`font-bold text-base mt-1 ${info.color || "text-gray-700"}`}
                      >
                        {info.val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRACKING LOGS TABLE */}
              <div className="bg-white p-6 rounded-2xl border w-full lg:w-2/3 shadow-sm overflow-hidden">
                <h2 className="font-bold text-lg mb-4 border-b pb-2">
                  System Logs
                </h2>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="p-3 border-b">Status</th>
                        <th className="p-3 border-b">Description</th>
                        <th className="p-3 border-b">Created</th>
                        <th className="p-3 border-b">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.history.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusColor(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700 font-medium">
                            {item.description}
                          </td>
                          <td className="p-3 text-gray-400 whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="p-3 text-gray-600 font-bold">
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
        )}
      </div>
    </div>
  );
}
