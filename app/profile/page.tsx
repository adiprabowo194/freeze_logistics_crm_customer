"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import TopNavbar from "@/components/TopNavbar";
import SelectSearch from "@/components/SelectSearch";
import MenuBars from "@/components/MenuBars";

type OptionType = {
  label: string;
  value: string;
  area_code: string;
  postcode: string; // Tambahkan ini
  zone_type: string; // Tambahkan ini
};

interface Address {
  id: number;
  area: OptionType | null;
  address: string;
}

export default function ProfileSettingsPage() {
  const [customerCode, setCustomerCode] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [phoneCompany, setPhoneCompany] = useState("");
  const [website, setWebsite] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([
    { id: 1, area: null, address: "" },
    { id: 2, area: null, address: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // ================= FETCH =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingFetch(true);

        // ✅ ambil session dulu
        const sessionRes = await fetch("/api/auth/me");
        const session = await sessionRes.json();

        if (!sessionRes.ok) throw new Error("Unauthorized");

        setCustomerCode(session.customer_code);
        setEmail(session.email);

        // ✅ fetch customer pakai customer_code
        const res = await fetch(`/api/customers/${session.customer_code}`);

        if (!res.ok) throw new Error("Failed fetch");

        const data = await res.json();

        setFullName(data.pic_name ?? "");
        setPhone(data.pic_phone ?? "");

        setCompanyName(data.company_name ?? "");
        setPhoneCompany(data.phone ?? "");
        setWebsite(data.website ?? "");

        setAddresses([
          {
            id: 1,
            area: data.pickupArea
              ? {
                  label: data.pickupArea.suburb,
                  value: data.pickupArea.suburb,
                  area_code: data.pickupArea.area_code,
                  postcode: data.pickupArea.postcode, // Tambahkan ini
                  zone_type: data.pickupArea.zone_type, // Tambahkan ini
                }
              : null,
            address: data.pickup_address ?? "",
          },
          {
            id: 2,
            area: data.officeArea
              ? {
                  label: data.officeArea.suburb,
                  value: data.officeArea.suburb,
                  area_code: data.officeArea.area_code,
                  postcode: data.officeArea.postcode, // Tambahkan ini
                  zone_type: data.officeArea.zone_type, // Tambahkan ini
                }
              : null,
            address: data.office_address ?? "",
          },
        ]);
      } catch (err) {
        console.error(err);
        alert("Failed to load data");
      } finally {
        setLoadingFetch(false);
      }
    };

    fetchData();
  }, []);

  // ================= HANDLE =================
  const handleAddressChange = (
    id: number,
    field: keyof Address,
    value: any,
  ) => {
    setAddresses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // ================= SAVE =================
  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        pic_name: fullName,
        pic_phone: phone,
        email,

        company_name: companyName,
        phone: phoneCompany,
        website,

        pickup_area_code: addresses[0]?.area?.area_code || null,
        pickup_address: addresses[0]?.address || "",

        office_area_code: addresses[1]?.area?.area_code || null,
        office_address: addresses[1]?.address || "",
      };

      const res = await fetch(`/api/customers/${customerCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.error);
      }

      // alert("Saved successfully!");
      toast.success("Saved successfully!");
      setShowAlert(!showAlert);
    } catch (err) {
      console.error(err);
      // alert("Failed to save data");
      toast.success("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />
      <Toaster position="top-right" />

      {/* Container utama: p-4 di mobile, lg:px-16 di desktop */}
      <div className="p-4 md:p-6 lg:px-16 max-w-[1400px] mx-auto">
        {/* Alert Responsive */}
        {showAlert && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm transition-all">
            <span className="flex-1">
              ✅ profile has been changed successfully.
            </span>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-4 text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Profile Settings
          </h1>

          {/* PERSONAL SECTION */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">
                Pic Name *
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">
                Email *
              </label>
              <input
                value={email}
                disabled
                className="p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">
                Pic Phone *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* COMPANY SECTION */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">
              Company Detail
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600">
                  Company Name *
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600">
                  Company Phone *
                </label>
                <input
                  value={phoneCompany}
                  onChange={(e) => setPhoneCompany(e.target.value)}
                  placeholder="Company Phone"
                  className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600">
                  Website
                </label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Website"
                  className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* ADDRESS SECTION: Menggunakan grid 2 kolom di desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border bg-gray-50/50 p-4 rounded-2xl space-y-3"
                >
                  <div className="bg-white rounded-lg">
                    <SelectSearch
                      label={
                        addr.id === 1 ? "Pickup Suburb *" : "Office Suburb *"
                      }
                      value={addr.area || undefined}
                      onChange={(val) =>
                        handleAddressChange(addr.id, "area", val)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Full Address
                    </label>
                    <textarea
                      rows={2}
                      value={addr.address}
                      onChange={(e) =>
                        handleAddressChange(addr.id, "address", e.target.value)
                      }
                      placeholder="Street name, No, etc."
                      className="border p-3 rounded-xl w-full bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={loading || loadingFetch}
              className={`w-full md:w-auto px-10 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                loading || loadingFetch
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
