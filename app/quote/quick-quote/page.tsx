"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";
import InputField from "@/components/InputField";
import SelectSearch from "@/components/SelectSearch";
import SelectField from "@/components/SelectField";
import TextareaField from "@/components/TextareaField";
import Button from "@/components/Button";

import { useRouter } from "next/navigation";
export default function QuickQuotePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [step, setStep] = useState(1);
  // ================= TYPE =================
  type Cargo = {
    cargoTemp: string;
    cargoUnit: string;
    qty: string;
    weight: string;
    length: string;
    width: string;
    height: string;
  };

  type CarrierRate = {
    rate_id: number;
    carrier_code: string;
    name: string;
    price: number;
    pickup_eta: string;
    delivery_eta: string;
  };

  // ================= LOCATION =================
  const [pickupSuburb, setPickupSuburb] = useState<any>(null);
  const [deliverySuburb, setDeliverySuburb] = useState<any>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  // ================= AUTO LOAD CUSTOMER =================
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch("/api/customers/me");
        const data = await res.json();

        // ✅ FIX: pakai field yang benar
        if (data?.pickup_suburb_code) {
          setPickupSuburb({
            label: `${data.pickup_suburb_name}, ${data.state}, ${data.postcode}`, // tampil
            value: data.pickup_suburb_code, // value harus code
            area_code: data.pickup_suburb_code,
            postcode: data.postcode,
            state: data.state,
          });

          // ✅ auto isi address juga
          setPickupAddress(data.pickup_address || "");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed load customer data");
      }
    };

    fetchCustomer();
  }, []);

  // ================= CARGO =================
  const [cargoList, setCargoList] = useState([
    {
      cargoTemp: "",
      cargoUnit: "",
      qty: "",
      weight: "",
      length: "",
      width: "",
      height: "",
    },
  ]);

  // 🔥 FIX DISINI (TYPE SAFE)
  // 🔥 EDIT FUNCTION INI
  const handleChange = <K extends keyof Cargo>(
    index: number,
    field: K,
    value: Cargo[K],
  ) => {
    const updated = [...cargoList];

    // 1. Logika Validasi Weight untuk Unit Box
    if (field === "weight") {
      const currentUnit = updated[index].cargoUnit;
      const weightValue = parseFloat(value as string);

      if (currentUnit === "box" && weightValue > 30) {
        // Tampilkan alert/toast
        alert("Maximum weight for Box is 30kg");

        // Paksa nilai menjadi 30
        updated[index][field] = "30" as Cargo[K];
        setCargoList(updated);
        return; // Stop eksekusi agar tidak tertimpa value asli
      }
    }

    // 2. Logika Tambahan: Jika Unit diubah ke Box, cek weight yang sudah ada
    if (field === "cargoUnit" && value === "box") {
      const currentWeight = parseFloat(updated[index].weight || "0");
      if (currentWeight > 30) {
        alert("Weight adjusted to 30kg for Box unit");
        updated[index].weight = "30";
      }
    }

    // Set value normal untuk field lainnya
    updated[index][field] = value;
    setCargoList(updated);
  };

  const handleAddCargo = () => {
    setCargoList([
      ...cargoList,
      {
        cargoTemp: "",
        cargoUnit: "",
        qty: "",
        weight: "",
        length: "",
        width: "",
        height: "",
      },
    ]);
  };

  const handleRemoveCargo = (index: number) => {
    setCargoList(cargoList.filter((_, i) => i !== index));
  };

  // ================= AUTO CALC =================
  const totalQty = cargoList.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );

  const totalWeight = cargoList.reduce(
    (sum, item) => sum + Number(item.weight || 0),
    0,
  );

  const totalCBM = cargoList.reduce((sum, item) => {
    const l = Number(item.length || 0);
    const w = Number(item.width || 0);
    const h = Number(item.height || 0);
    return sum + (l * w * h) / 1000000;
  }, 0);

  // ================= CARRIER =================
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loadingCarrier, setLoadingCarrier] = useState(false);

  const fetchRates = async () => {
    try {
      if (!pickupSuburb || !deliverySuburb) return;

      setLoadingCarrier(true);

      const res = await fetch("/api/cargo-quote/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // customer_code: "CUST001", // 🔥 nanti ambil dari session
          origin_state: pickupSuburb.state,
          dest_state: deliverySuburb.state,
          zone_type: deliverySuburb.zone_type,
          cargos: cargoList.map((c) => ({
            unit: c.cargoUnit,
            qty: Number(c.qty),
          })),
        }),
      });

      const data = await res.json();
      console.log(data);

      if (!res.ok) throw new Error(data.message);

      setCarriers(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingCarrier(false);
    }
  };

  // ================= RECEIVER =================
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  // ================= VALIDATION =================
  const handleNext = async () => {
    if (step === 1) {
      if (!pickupSuburb || !deliverySuburb) {
        return toast.error("Please complete location");
      }

      for (let cargo of cargoList) {
        if (!cargo.cargoTemp || !cargo.cargoUnit) {
          return toast.error("Temperature & Unit must fill");
        }
        if (!cargo.qty || !cargo.weight) {
          return toast.error("Qty & Weight must fill");
        }
      }

      // 🔥 CALL API DISINI
      await fetchRates();
    }

    if (step === 2 && !selectedCarrier) {
      return toast.error("Please select carrier");
    }

    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  // ================= SUBMIT =================
  const handleSubmit = async (status: "Entry" | "Booking") => {
    try {
      setLoading(true);
      if (step === 2 && !selectedCarrier) {
        return toast.error("Please select carrier");
      }
      if (
        step === 3 &&
        (!pickupDate?.trim() ||
          !receiverName?.trim() ||
          !receiverPhone?.trim() ||
          !deliveryAddress?.trim())
      ) {
        return toast.error(
          "Please input Pickup Date, Receiver name & Receiver phone",
        );
      }
      const payload = {
        suburb_origin: pickupSuburb?.area_code,
        suburb_destination: deliverySuburb?.area_code,
        pickup_address: pickupAddress,
        pickupDate: pickupDate, // ✅ pastikan ada state nya
        delivery_address: deliveryAddress,

        receiver_name: receiverName,
        receiver_phone: receiverPhone,

        carrier: selectedCarrier?.carrier_code,
        price_all_in: selectedCarrier?.price,
        carrier_price:
          selectedCarrier?.breakdown?.[0].first_unit_price +
          selectedCarrier?.breakdown?.[0].next_unit_price,
        rate_id: selectedCarrier?.rate_id,

        delivery_eta: selectedCarrier?.delivery_eta,
        pickup_eta: selectedCarrier?.pickup_eta,

        status,

        cargos: cargoList.map((c) => ({
          temperature: c.cargoTemp,
          unit: c.cargoUnit,
          qty: Number(c.qty),
          weight: Number(c.weight),
          length: Number(c.length),
          width: Number(c.width),
          height: Number(c.height),
        })),

        total_qty: totalQty,
        total_weight: totalWeight,
        total_cbm: totalCBM,
      };
      console.log([payload, selectedCarrier]);

      const res = await fetch("/api/cargo-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      toast.success(
        status === "Booking" ? "Quote submitted 🚀" : "Quote saved as draft 💾",
      );

      // 🔥 DELAY BIAR USER LIHAT TOAST
      setTimeout(() => {
        if (status === "Booking") {
          router.push("/jobs/booking");
        } else {
          router.push("/quote/save-quote");
        }
      }, 800);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi bantuan untuk mendapatkan format YYYY-MM-DD
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    // Menambahkan 1 karena bulan dimulai dari 0, lalu padStart agar jadi 2 digit
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
  return (
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />
      <Toaster position="top-right" />

      <div className="p-6 px-8 md:px-16">
        <h1 className="text-2xl font-bold mb-6">Quick Quote</h1>

        {/* STEP */}
        <div className="flex gap-3 mb-6">
          {["Input", "Carrier", "Final"].map((s, i) => (
            <div
              key={i}
              className={`px-4 py-2 rounded-full text-sm ${
                step === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="font-semibold mb-4">Pickup & Delivery</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <SelectSearch
                  label="Sending Suburb *"
                  value={pickupSuburb}
                  onChange={setPickupSuburb}
                />

                <SelectSearch
                  label="Receiver Suburb *"
                  value={deliverySuburb}
                  onChange={setDeliverySuburb}
                />
              </div>
            </div>

            {/* Cargo */}
            <div className="bg-white p-6 rounded-2xl shadow">
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">Cargo</h2>
                <button
                  onClick={handleAddCargo}
                  className="bg-yellow-400 text-white px-3 py-1 rounded-lg"
                >
                  + Add Item
                </button>
              </div>

              {cargoList.map((cargo, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-7 gap-4 mb-4 border p-4 rounded-xl"
                >
                  <div className="grid grid-cols-2 gap-2 md:col-span-3">
                    <SelectField
                      label="Temperature *"
                      name="cargoTemp"
                      value={cargo.cargoTemp}
                      onChange={(val) => handleChange(index, "cargoTemp", val)}
                      options={[
                        { label: "Frozen", value: "frozen" },
                        { label: "Chilled", value: "chilled" },
                      ]}
                    />
                    <SelectField
                      label="Unit *"
                      name="cargoUnit"
                      value={cargo.cargoUnit}
                      onChange={(val) => handleChange(index, "cargoUnit", val)}
                      options={[
                        { label: "Pallet", value: "pallet" },
                        { label: "Box", value: "box" },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:col-span-2">
                    <InputField
                      type="number"
                      label="Qty *"
                      name="qty"
                      value={cargo.qty}
                      onChange={(e) =>
                        handleChange(index, "qty", e.target.value)
                      }
                    />
                    <InputField
                      type="number"
                      name="weight"
                      label="Weight (kg)*"
                      value={cargo.weight}
                      onChange={(e) =>
                        handleChange(index, "weight", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <InputField
                      type="number"
                      name="length"
                      label="Length (cm) *"
                      value={cargo.length}
                      onChange={(e) =>
                        handleChange(index, "length", e.target.value)
                      }
                    />
                    <InputField
                      type="number"
                      name="width"
                      label="Width (cm) *"
                      value={cargo.width}
                      onChange={(e) =>
                        handleChange(index, "width", e.target.value)
                      }
                    />
                    <InputField
                      type="number"
                      name="height"
                      label="Height (cm) *"
                      value={cargo.height}
                      onChange={(e) =>
                        handleChange(index, "height", e.target.value)
                      }
                    />
                  </div>

                  {cargoList.length > 1 && (
                    <div className="md:col-span-7 text-right">
                      <button
                        onClick={() => handleRemoveCargo(index)}
                        className="text-red-500 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-2 mb-2">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                Available Carriers
              </h2>
            </div>

            {loadingCarrier ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">
                  Fetching best rates...
                </p>
              </div>
            ) : carriers.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">No rates found for this route.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {carriers.map((c: any, i: number) => {
                  const isSelected = selectedRateId === c.rate_id;
                  const isCheapest = i === 0;

                  // LOGIKA UNIT - Pastikan mapping sesuai data source
                  // ✅ PERBAIKAN: Gunakan cargoList, bukan cargos
                  const uniqueUnits = Array.from(
                    new Set(
                      cargoList
                        .map((item) => item.cargoUnit) // Ambil unit dari cargoList
                        .filter(Boolean) // Buang yang kosong
                        .map((u) => u.toUpperCase().trim()), // Standarisasi
                    ),
                  ).join(", "); // ✅ Pastikan .join ada di paling luar Array.from

                  console.log("Unique Units String:", uniqueUnits);

                  return (
                    <div
                      key={c.rate_id || i}
                      onClick={() => {
                        setSelectedCarrier(c);
                        setSelectedRateId(c.rate_id);
                      }}
                      className={`relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-6 rounded-xl border-2 transition-all duration-300 
                        ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 shadow-lg scale-[1.01]"
                            : "border-white bg-white hover:border-gray-200 hover:shadow-md"
                        } 
                      cursor-pointer mb-4`}
                    >
                      {/* INDICATOR LINE */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                      )}

                      {/* SECTION 1: LOGO & IDENTITY */}
                      <div className="flex items-center gap-6 w-full md:w-[40%]">
                        <div className="w-20 h-14 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm border border-gray-50">
                          <img
                            // Menggabungkan Base URL dengan path yang datang dari API
                            src={`https://admin.freezelogistics.com.au/${c.carrier_image_path}`}
                            alt={c.name}
                            className="object-contain max-h-full w-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const defaultSrc = `https://admin.freezelogistics.com.au/assets/carrier_logo/default.webp`;

                              // Fallback ke logo default jika image_path tidak ditemukan
                              if (target.src !== defaultSrc) {
                                target.src = defaultSrc;
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-col md:w-[35%]">
                          <h3 className="font-black text-gray-900 text-xl leading-none mb-1 uppercase italic tracking-tighter">
                            {c.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">
                              {c.carrier_code}
                            </span>
                            {uniqueUnits && (
                              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black uppercase shadow-sm tracking-tight">
                                {uniqueUnits.length > 20
                                  ? uniqueUnits.substring(0, 20) + "..."
                                  : uniqueUnits}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-400 uppercase">
                              Qty :
                            </p>
                            <p className="text-sm font-black  bg-blue-500 text-white px-2 py-0.5 rounded uppercase">
                              {totalQty} Unit
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-400 uppercase">
                              Weight :
                            </p>
                            <p className="text-sm font-black text-gray-900">
                              {totalWeight} Kg
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: TRANSIT VISUALIZER (Berdasarkan Gambar Upload) */}
                      <div className="flex flex-1 items-center justify-center gap-6 py-6 md:py-0 w-full px-4">
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            Pickup ETA
                          </p>
                          <p className="text-sm font-black text-gray-900">
                            {c.pickup_eta} Days
                          </p>
                          {/* <span>{`https://admin.freezelogistics.com.au${c.carrier_image_path}`}</span> */}
                        </div>

                        <div className="flex flex-col items-center flex-1 max-w-[180px]">
                          <div className="flex items-center w-full gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                            <div className="h-[2px] flex-1 border-t-2 border-dashed border-gray-300 relative">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-blue-100 px-2 py-0.5 rounded-full shadow-sm">
                                <span className="text-[8px] font-black text-blue-600 uppercase">
                                  Transit
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-tighter">
                            Express Service
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            Delivery ETA
                          </p>

                          <p className="text-sm font-black text-gray-900">
                            {c.delivery_eta} Days
                          </p>
                        </div>
                      </div>

                      {/* SECTION 3: PRICING */}
                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-4 md:pt-0">
                        <div className="text-right">
                          {isCheapest && (
                            <span className="text-[8px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase mb-1 inline-block">
                              Best Rate
                            </span>
                          )}
                          <div className="flex items-baseline justify-end">
                            <span className="text-sm font-bold text-gray-900 mr-0.5">
                              $
                            </span>
                            <span className="text-3xl font-black text-gray-900 tracking-tighter">
                              {Number(c.price).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-blue-600 uppercase">
                            Price All-in
                          </p>
                        </div>

                        <button
                          className={`h-12 px-6 rounded-xl font-bold text-sm transition-all border-2 
            ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                : "bg-white border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
            }`}
                        >
                          {isSelected ? "SELECTED" : "SELECT"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow">
            <h2 className="font-semibold text-lg">Final Details</h2>

            {/* ================= LOCATION ================= */}
            <div>
              <h3 className="font-medium mb-2">Pickup & Delivery</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <SelectSearch
                  label="Sending Suburb *"
                  value={pickupSuburb}
                  onChange={setPickupSuburb}
                />

                <SelectSearch
                  label="Receiver Suburb *"
                  value={deliverySuburb}
                  onChange={setDeliverySuburb}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <TextareaField
                  name="pickupAddress"
                  label="Pickup Address *"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />

                <TextareaField
                  name="deliveryAddress"
                  label="Receiver Address *"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>

            {/* ================= CARGO ================= */}
            <div>
              <h3 className="font-medium mb-2">Cargo Details</h3>

              {cargoList.map((cargo, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-7 gap-4 mb-4 border p-4 rounded-xl bg-gray-50"
                >
                  <div className="grid grid-cols-2 gap-2 md:col-span-3">
                    <InputField
                      name="cargoTemp"
                      label="Temperature"
                      value={cargo.cargoTemp}
                      disabled
                    />
                    <InputField
                      label="Unit"
                      name="unit"
                      value={cargo.cargoUnit}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:col-span-2">
                    <InputField
                      label="Qty"
                      name="qty"
                      value={cargo.qty}
                      disabled
                    />
                    <InputField
                      label="Weight"
                      name="weight"
                      value={cargo.weight}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <InputField
                      label="Length"
                      name="length"
                      value={cargo.length}
                      disabled
                    />
                    <InputField
                      label="Width"
                      name="width"
                      value={cargo.width}
                      disabled
                    />
                    <InputField
                      label="Height"
                      name="height"
                      value={cargo.height}
                      disabled
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ================= SUMMARY ================= */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p>
                Total Qty: <b>{totalQty}</b>
              </p>
              <p>
                Total Weight: <b>{totalWeight} kg</b>
              </p>
              <p>
                Total CBM: <b>{totalCBM.toFixed(3)} m³</b>
              </p>
            </div>

            {/* ================= CARRIER ================= */}
            <div className="bg-white border-2 border-blue-500 rounded-2xl overflow-hidden shadow-md">
              {/* Header kecil penanda */}
              <div className="bg-blue-500 px-4 py-1">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Selected Carrier
                </span>
              </div>

              <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* SECTION 1: LOGO & IDENTITY */}
                <div className="flex items-center gap-4 w-full md:w-[30%] space-x-4">
                  <div className="space-x-2 w-34 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-gray-100 shrink-0">
                    <img
                      src={`https://admin.freezelogistics.com.au/${selectedCarrier?.carrier_image_path}`}
                      alt={selectedCarrier?.name}
                      className="object-contain max-h-full w-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/carrier_logo/default.webp";
                      }}
                    />
                  </div>
                  <div className="w-full">
                    <h3 className="font-black text-gray-900 text-2xl leading-tight uppercase italic tracking-tighter">
                      {selectedCarrier?.name}
                    </h3>
                    <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded font-bold uppercase">
                      {selectedCarrier?.carrier_code}
                    </span>
                  </div>
                </div>

                {/* SECTION 2: TRANSIT VISUALIZER (Mini version) */}
                <div className="flex flex-1 items-center justify-center gap-6 w-full max-w-md">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                      Pickup
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedCarrier?.pickup_eta}
                    </p>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-600 to-gray-200 mx-1"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-200"></div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                      Arrival
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedCarrier?.delivery_eta}
                    </p>
                  </div>
                </div>

                {/* SECTION 3: PRICING */}
                <div className="text-right w-full md:w-auto border-t md:border-0 pt-4 md:pt-0">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-sm font-bold text-gray-400 mr-1">
                      $
                    </span>
                    <span className="text-2xl font-black text-gray-900 tracking-tighter">
                      {Number(selectedCarrier?.price).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight">
                    Price All-in
                  </p>
                </div>
              </div>
            </div>

            {/* ================= RECEIVER ================= */}
            <div>
              <h3 className="font-medium mb-2">Pickup & Receiver Info</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <InputField
                  name="pickupDate"
                  type="date"
                  label="Pickup Date *"
                  value={pickupDate}
                  // onChange={(e) => setPickupDate(e.target.value)}
                  onChange={(e) => setPickupDate(e.target.value)}
                  // Opsional: tambahkan 'min' agar user tidak bisa pilih tanggal sebelum besok
                  min={getTomorrowDate()}
                />

                <InputField
                  name="receiverName"
                  label="Receiver Name *"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />

                <InputField
                  name="receiverPhone"
                  label="Receiver Phone *"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* BUTTON */}
        <div className="mt-6">
          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex justify-between items-center">
              {/* LEFT */}
              <Button
                onClick={handleBack}
                className="px-6 py-2 rounded-lg bg-white border"
                variant="secondary"
              >
                Back
              </Button>

              {/* RIGHT */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleSubmit("Entry")}
                  className="px-6 py-2 rounded-lg w-50"
                  variant="yellow"
                >
                  Save Quote
                </Button>

                <Button
                  onClick={handleNext}
                  className="px-6 py-2 rounded-lg w-50"
                  variant="primary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex justify-between items-center">
              {/* LEFT */}
              <Button
                onClick={handleBack}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg"
                variant="secondary"
              >
                Back
              </Button>

              {/* RIGHT */}
              <Button
                onClick={() => handleSubmit("Booking")}
                disabled={loading}
                className="bg-blue-400 hover:bg-blue-500 text-black px-12 py-3 rounded-lg text-base"
              >
                {loading ? "Submitting..." : "Book Now"}
              </Button>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-blue-400 hover:bg-blue-500 text-black px-6 py-2 rounded-lg w-[30%]"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
