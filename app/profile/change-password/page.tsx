"use client";

import { useState } from "react";
import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";

export default function ChangePasswordPage() {
  const CUSTOMER_CODE = "CUST001";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // ================= HANDLE SAVE =================
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return alert("All fields are required");
    }

    if (newPassword !== confirmPassword) {
      return alert("New password and confirm password do not match");
    }

    if (newPassword.length < 6) {
      return alert("Password must be at least 6 characters");
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/customers/${CUSTOMER_CODE}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed");
      }

      alert("Password changed successfully!");

      // reset
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />

      {/* Container utama: Padding p-4 di mobile agar tidak mepet */}
      <div className="p-4 md:p-6 lg:px-16 max-w-[1400px] mx-auto">
        <div className="md:px-6 space-y-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Change Password
          </h1>

          {/* Card: max-w-xl tetap dijaga agar input tidak terlalu lebar di desktop */}
          <div className="bg-white p-5 md:p-8 rounded-2xl border shadow-sm max-w-xl space-y-5">
            {/* CURRENT PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-600">
                Current Password
              </label>
              <div className="flex group">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="p-3 border rounded-l-xl w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="px-4 border border-l-0 rounded-r-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  {showCurrent ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-600">
                New Password
              </label>
              <div className="flex group">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="p-3 border rounded-l-xl w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="px-4 border border-l-0 rounded-r-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-600">
                Confirm Password
              </label>
              <div className="flex group">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="p-3 border rounded-l-xl w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="px-4 border border-l-0 rounded-r-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* BUTTON: Margin top ditambahkan agar ada jarak dari input terakhir */}
            <div className="pt-2">
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className={`w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 flex justify-center items-center gap-2 ${
                  loading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
