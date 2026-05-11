"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import InputField from "@/components/InputField";
import SelectSearch from "@/components/SelectSearch";
import TextareaField from "@/components/TextareaField";
import Button from "@/components/Button";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Page() {
  const [suburb, setSuburb] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;

    const payload = {
      companyName: (form.companyName as HTMLInputElement).value,
      abn: (form.abn as HTMLInputElement).value,
      email: (form.email as HTMLInputElement).value,
      website: (form.website as HTMLInputElement).value,
      contactName: (form.contactName as HTMLInputElement).value,
      contactNo: (form.contactNo as HTMLInputElement).value,
      suburb: suburb?.value,
      companyAddress: (form.companyAddress as HTMLTextAreaElement).value,
      inputType: 2,
    };

    try {
      if (!suburb) {
        toast.error("Suburb is required");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/customer-candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed submit data");
      } else {
        toast.success("Customer registered successfully");

        // ✅ reset form
        form.reset();

        // ✅ reset select
        setSuburb(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* LEFT */}
      <div
        className="w-full md:w-[52%] h-[300px] md:h-auto relative bg-cover bg-center order-2 md:order-1"
        style={{ backgroundImage: "url('/assets/warehouse.webp')" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(66,103,215,0.2) 0%, rgba(66,103,215,0.8) 61%, rgba(66,103,215,1) 95%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-12 text-white">
          <Logo
            size="sm"
            textColor="text-white"
            color="text-white"
            width={140}
            height={140}
          />

          <h1 className="text-2xl md:text-6xl font-bold mb-4 tracking-wide leading-tight">
            Why Freeze <br /> Logistics?
          </h1>

          <p className="text-sm md:text-base opacity-90 mb-6">
            Experience premium chilled and frozen product distribution
          </p>

          <Link
            href="https://freezelogistics.com.au"
            target="_blank"
            className="text-sm opacity-80 hover:underline"
          >
            www.freezelogistics.com.au
          </Link>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full md:w-[48%] bg-[#F4F6FA] flex items-center justify-center order-1 md:order-2">
        <div className="w-full max-w-xl px-6 md:px-8 py-8">
          <Link
            href="/login"
            className="text-xs font-semibold text-gray-500 hover:underline"
          >
            ← Back to login
          </Link>

          <div className="mt-4 mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Register Customer
            </h2>
            <p className="text-sm text-gray-400">
              Please fill the form with your company details
            </p>
          </div>
          <Toaster position="top-right" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Company Name"
                name="companyName"
                required={true}
              />
              <InputField label="ABN" name="abn" type="text" required={true} />
              <InputField
                label="Contact Name"
                name="contactName"
                required={true}
              />
              <InputField
                label="Contact Number."
                name="contactNo"
                required={true}
              />
              <InputField
                label="Email"
                name="email"
                type="email"
                required={true}
              />
              <InputField label="Website" name="website" required={false} />
              <TextareaField
                rows={2}
                label="Street Address"
                name="companyAddress"
                required={true}
              />

              <SelectSearch
                label="Suburb"
                value={suburb} // ✅ penting
                onChange={(val) => setSuburb(val)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-sm bg-gradient-to-r from-blue-500 to-indigo-500"
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
