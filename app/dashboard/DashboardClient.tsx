"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import useQuotes from "@/hooks/useQuotes";
import Link from "next/link";
import useDebounce from "@/hooks/useDebounce";
import Button from "@/components/Button";
import TextareaField from "@/components/TextareaField";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";
import InputField from "@/components/InputField";

export default function DashboardClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [statusList] = useState<string[]>([
    "Booking",
    "Delivered",
    "Pickup",
    "Delivery",
    "Confirm",
  ]);
  const debouncedSearch = useDebounce(search);

  const { data, totalPages, loading } = useQuotes({
    page,
    limit,
    search: debouncedSearch,
    status,
    statusList,
  });

  const [showAlert, setShowAlert] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);

  useEffect(() => {
    const isLogin = sessionStorage.getItem("just_login");
    if (isLogin) {
      setShowAlert(true);
      toast.success("Welcome to dashboard");
      sessionStorage.removeItem("just_login");
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingMessage(true);
    const form = e.currentTarget;
    const payload = {
      enquiry: (form.enquiry as HTMLInputElement).value,
      connote_no: (form.connote_no as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/send-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Your Enquiry successfully sent");
      form.reset();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoadingMessage(false);
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
      <Toaster position="top-right" />

      {/* Padding dinamis: p-4 di mobile, lg:px-16 di desktop */}
      <div className="p-4 md:p-6 lg:px-16 max-w-[1600px] mx-auto">
        {/* ALERT */}
        {showAlert && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span>✅ Welcome back! You have successfully logged in.</span>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-4 text-green-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* MAIN LAYOUT: Grid 1 kolom di mobile, 2 kolom di desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* 📊 RECENT JOBS SECTION */}
          <div className="lg:col-span-7 order-2 lg:order-1 bg-white rounded-2xl border shadow-sm p-4 md:p-6">
            <h2 className="text-xl md:text-2xl mb-4 font-bold text-gray-800">
              Recent Jobs
            </h2>

            {/* TOOLBAR: flex-col di mobile */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="border px-4 py-2 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="Delivered">Delivered</option>
                <option value="booking">Booking</option>
              </select>

              <input
                placeholder="Search connote..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="border px-4 py-2 rounded-xl text-sm w-full bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* LIST ITEMS */}
            <div className="space-y-4">
              {(data || []).map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl border p-4 md:p-5 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all duration-300"
                >
                  <Link
                    href={`/jobs/detail/${item.connote_no}`}
                    className="block"
                  >
                    {/* 💡 TOOLTIP UTAMA (Desktop Only) */}
                    <div className="absolute -top-10 left-6 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 hidden md:block translate-y-2 group-hover:translate-y-0">
                      <div className="bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                        <i className="ri-information-line text-blue-300"></i>
                        Click to view full job details
                      </div>
                      <div className="w-2 h-2 bg-gray-800 rotate-45 ml-4 -mt-1"></div>
                    </div>

                    {/* Link Utama yang membungkus area konten (kecuali area tombol aksi jika ada) */}

                    <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                      {/* LEFT: Identitas & Rute */}
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center md:block">
                          <p className="font-bold text-blue-600 md:text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                            {item.connote_no}
                            <i className="ri-external-link-line opacity-0 group-hover:opacity-100 text-xs transition-all"></i>
                          </p>
                          {/* Badge Status (Hanya Muncul di Mobile pada header) */}
                          <div className="md:hidden">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                        <p className="text-xs md:text-sm font-medium text-gray-600 uppercase flex items-center gap-2">
                          <span className="truncate max-w-[100px] md:max-w-none">
                            {item.originArea?.suburb}
                          </span>
                          <i className="ri-arrow-right-line text-gray-300"></i>
                          <span className="truncate max-w-[100px] md:max-w-none">
                            {item.destinationArea?.suburb}
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Created: {formatDate(item.createdAt) || "-"}
                        </p>
                      </div>

                      {/* MIDDLE: Statistik Cargo */}
                      <div className="flex items-center gap-4 md:gap-8 border-t border-b md:border-none py-3 md:py-0 border-gray-50">
                        <div className="text-center md:text-left">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                            Weight
                          </p>
                          <p className="text-sm font-semibold text-gray-700">
                            📦 {item.total_weight || 0} kg
                          </p>
                        </div>
                        <div className="text-center md:text-left">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                            Quantity
                          </p>
                          <p className="text-sm font-semibold text-gray-700">
                            {item.total_qty || 0} Pcs
                          </p>
                        </div>
                      </div>

                      {/* RIGHT: Status & Arrow Indicator */}
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="hidden md:block">
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-blue-500 text-xl"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {loading && (
              <p className="text-center py-10 text-gray-400 animate-pulse">
                Loading data...
              </p>
            )}
            {!loading && data?.length === 0 && (
              <p className="text-center py-10 text-gray-400">No jobs found.</p>
            )}

            {/* PAGINATION & LIMIT */}
            <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Show</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded-lg px-2 py-1 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
              />
            </div>
          </div>

          {/* ⚡ ACTION & ENQUIRY SECTION */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
            {/* QUICK ACTIONS */}
            <div className="flex gap-3 md:gap-4">
              <Link href="/track-shipment" className="flex-1">
                <Button
                  variant="blue"
                  className="w-full py-3 shadow-lg flex items-center justify-center gap-2 rounded-2xl"
                >
                  <i className="ri-map-pin-line"></i> Tracking
                </Button>
              </Link>
              <Link href="/quote/quick-quote" className="flex-[2]">
                <Button
                  variant="yellow"
                  className="w-full py-3 shadow-lg flex items-center justify-center gap-2 rounded-2xl text-yellow-900"
                >
                  <i className="ri-flashlight-line font-bold"></i> Quick Quote
                </Button>
              </Link>
            </div>

            {/* ENQUIRY FORM */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="text-xl md:text-2xl mb-4 font-bold text-gray-800">
                Enquiry
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                  type="text"
                  label="Connote Number"
                  name="connote_no"
                  required={true}
                  placeholder="Ex: CN123..."
                />
                <TextareaField
                  rows={5}
                  label="Your Question"
                  name="enquiry"
                  required={true}
                  placeholder="How can we help you?"
                />
                <Button
                  type="submit"
                  disabled={loadingMessage}
                  className="w-full rounded-xl py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md active:scale-95"
                >
                  {loadingMessage ? "Submitting..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
