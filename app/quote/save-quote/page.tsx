"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import useQuotes from "@/hooks/useQuotes";
import Link from "next/link";
import useDebounce from "@/hooks/useDebounce";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";

export default function DashboardClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Entry");
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search);

  const { data, totalPages, loading } = useQuotes({
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
    const isLogin = sessionStorage.getItem("just_login");
    setPage(1);
    if (isLogin) {
      setShowAlert(true);
      toast.success("Welcome to dashboard");
      sessionStorage.removeItem("just_login");

      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [limit]);

  const handleDelete = async (connote_no: string) => {
    try {
      const confirmDelete = confirm("Are you sure delete this quote?");
      if (!confirmDelete) return;

      const res = await fetch("/api/cargo-quote/delete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connote_no }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Quote deleted 🗑️");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />
      <Toaster position="top-right" />

      {/* Container: Responsive padding (p-4 mobile, px-16 desktop) */}
      <div className="p-4 md:p-6 lg:px-16 max-w-[1400px] mx-auto">
        {/* Login Alert: Responsive Margin */}
        {showAlert && (
          <div className="mx-0 md:mx-8 mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm transition-all">
            <span className="flex-1">
              ✅ Welcome back! You have successfully logged in.
            </span>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-4 text-green-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* 📊 RECENT JOBS CONTAINER */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 md:px-8">
          {/* Main Card: Ubah w-3/4 menjadi w-full agar tidak sempit di mobile */}
          <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-8 w-full lg:w-3/4 space-y-6">
            {/* Header: Judul & Button Quick Quote */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
                List Save Quotes
              </h2>
              <Link href="/quote/quick-quote" className="w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="yellow"
                  className="w-full justify-center md:px-8"
                >
                  <i className="ri-stack-line mr-2"></i> Quick Quote
                </Button>
              </Link>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                placeholder="Search connote / origin / destination..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="border px-4 py-3 rounded-xl text-sm w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              />
            </div>

            {/* List Data */}
            <div className="space-y-4 pt-2">
              {(data || []).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center justify-between rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all gap-4"
                >
                  {/* LEFT: Identitas Connote */}
                  <div className="space-y-1">
                    <p className="font-bold text-lg text-blue-500 tracking-tight">
                      {item.connote_no}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      📍 {item.originArea?.suburb}{" "}
                      <span className="text-gray-300">→</span>{" "}
                      {item.destinationArea?.suburb}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  {/* MIDDLE: Statistik Cargo & Status */}
                  <div className="text-sm text-gray-600 flex flex-row md:flex-col gap-4 md:gap-2 border-y md:border-0 py-3 md:py-0">
                    <p className="flex items-center gap-2">
                      <i className="ri-archive-2-fill text-blue-400"></i>{" "}
                      {item.total_qty} qty
                    </p>
                    <p className="flex items-center gap-2">
                      <i className="ri-weight-fill text-blue-400"></i>{" "}
                      {item.total_weight} kg
                    </p>
                    <div className="md:mt-1">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  {/* RIGHT: Actions */}
                  <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto">
                    <Link
                      href={`/quote/quick-quote/${item.connote_no}`}
                      className="flex-1 w-full"
                    >
                      <Button
                        type="button"
                        disabled={loading}
                        variant="primary"
                        className="w-full text-sm font-bold py-2 shadow-sm"
                      >
                        Process
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(item.connote_no)}
                      className="text-red-500 text-xs font-bold px-4 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading & Empty State */}
            {loading && (
              <p className="text-sm text-gray-400 text-center py-4">
                Loading...
              </p>
            )}
            {!loading && data?.length === 0 && (
              <div className="py-10 text-center border-2 border-dashed rounded-2xl text-gray-400">
                No saved quotes found
              </div>
            )}

            {/* Pagination & Limit Select */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Show</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded-lg px-2 py-1.5 text-sm bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-500 font-medium">
                  entries
                </span>
              </div>
              <div className="w-full sm:w-auto flex justify-center overflow-x-auto">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  setPage={setPage}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Placeholder (jika nanti ada isi, biarkan kosong dulu atau hapus w-3/4 tadi) */}
        </div>
      </div>
    </div>
  );
}
