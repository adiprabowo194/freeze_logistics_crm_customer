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

import { useRouter, useParams } from "next/navigation";
export default function QuickQuotePage() {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const connoteNo = params?.connoteNo as string;
  const router = useRouter();
  const [step, setStep] = useState(3);
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

  // ================= LOCATION =================
  const [pickupSuburb, setPickupSuburb] = useState<any>(null);
  const [deliverySuburb, setDeliverySuburb] = useState<any>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [saveQuote, setSaveQuote] = useState(true);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // ================= AUTO LOAD CUSTOMER =================
  useEffect(() => {
    if (!connoteNo) return;

    const loadData = async () => {
      try {
        const res = await fetch(`/api/quotes/${connoteNo}`);
        const result = await res.json();

        const q = result.data;

        // 🔥 SET STATE
        setPickupSuburb({
          label: q.originArea?.suburb + ", " + q.originArea?.postcode,
          value: q.suburb_origin,
          area_code: q.suburb_origin,
          postcode: q.originArea?.postcode,
          state: q.originArea?.state,
          zone_type: q.originArea?.zone_type,
        });

        setDeliverySuburb({
          label: q.destinationArea?.suburb + ", " + q.destinationArea?.postcode,
          value: q.suburb_destination,
          area_code: q.suburb_destination,
          postcode: q.destinationArea?.postcode,
          state: q.destinationArea?.state,
          zone_type: q.destinationArea?.zone_type,
        });

        setPickupAddress(q.pickup_address || "");
        setDeliveryAddress(q.delivery_address || "");
        setPickupDate(q.pickup_date?.split("T")[0] || "");

        setReceiverName(q.receiver_name || "");
        setReceiverPhone(q.receiver_phone || "");

        const foundCarrier = {
          name: q.carrierDetail.carrier_name,
          pickup_eta: q.eta_pickup,
          delivery_eta: q.eta_delivery,
          price: q.price_all_in,
          carrier_code: q.carrier,
          rate_id: q.rate_id,
        };

        if (foundCarrier) {
          setSelectedCarrier(foundCarrier);
        } else {
          // fallback kalau tidak ketemu
          setSelectedCarrier({
            name: q.carrier,
            pickup_eta: "-",
            delivery_eta: "-",
            price: 0,
            carrier_code: "-",
            rate_id: null,
          });
        }

        // 🔥 cargos
        const mappedCargo = q.packageDetails.map((c: any) => ({
          cargoTemp: c.temperature,
          cargoUnit: c.unit,
          qty: c.qty,
          weight: c.weight,
          length: c.length,
          width: c.width,
          height: c.height,
        }));

        setCargoList(mappedCargo);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed load quote detail");
      }
    };

    loadData();
    // console.log("PARAMS:", params);
    // console.log("CONNOTE:", connoteNo);
  }, [connoteNo, params]);
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
  const handleBackFirstStep = () => {
    setSaveQuote(!saveQuote);
    if (saveQuote) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
    console.log(step);
  };

  // ================= Edit & update =================
  const handleEdit = async (status: "Entry" | "Booking") => {
    try {
      setLoading(true);
      if (!connoteNo) {
        return toast.error("Connote number not found");
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

      const res = await fetch(`/api/quotes/${connoteNo}`, {
        method: "PUT", // 🔥 UPDATE
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Update failed");

      toast.success("Quote updated successfully 🚀");

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
                      label="Length (cm)*"
                      value={cargo.length}
                      onChange={(e) =>
                        handleChange(index, "length", e.target.value)
                      }
                    />
                    <InputField
                      name="width"
                      label="Width (cm)*"
                      value={cargo.width}
                      onChange={(e) =>
                        handleChange(index, "width", e.target.value)
                      }
                    />
                    <InputField
                      type="number"
                      name="height"
                      label="Height (cm)*"
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
                {carriers.map((c, i) => {
                  // FIX: Pastikan perbandingannya konsisten dengan state yang diupdate
                  // const isSelected = selectedRateId === c.rate_id;
                  const isSelected = selectedCarrier?.rate_id === c.rate_id;
                  const isCheapest = i === 0;

                  return (
                    <div
                      key={i}
                      // FIX: Update kedua state saat diklik
                      onClick={() => {
                        setSelectedCarrier(c);
                        setSelectedRateId(c.rate_id);
                      }}
                      className={`relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-6 rounded-xl border-2 transition-all duration-300 
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 shadow-lg scale-[1.01]"
                    : "border-white bg-white hover:border-gray-200 hover:shadow-md"
                } cursor-pointer`}
                    >
                      {/* INDICATOR LINE */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSelected ? "bg-blue-600" : "bg-transparent"}`}
                      ></div>

                      {/* SECTION 1: LOGO & IDENTITY */}
                      <div className="flex items-center gap-6 w-full md:w-[30%]">
                        <div className="space-x-2 w-34 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm border border-gray-50">
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
                        <div className="w-full">
                          <h3 className="font-black text-gray-900 text-2xl leading-none mb-1 uppercase italic tracking-tighter">
                            {c.name}
                          </h3>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">
                            {c.carrier_code}
                          </span>
                        </div>
                      </div>

                      {/* SECTION 2: TRANSIT VISUALIZER */}
                      <div className="flex flex-1 items-center justify-center gap-4 md:gap-10 py-6 md:py-0 w-full">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Pickup ETA
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {c.pickup_eta}
                          </p>
                        </div>

                        <div className="flex flex-col items-center min-w-[120px] md:min-w-[150px]">
                          <div className="flex items-center w-full">
                            <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-600 to-gray-300 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-white px-2 py-0.5 rounded-full border border-gray-100 text-[9px] font-black text-blue-600 uppercase tracking-tighter shadow-sm">
                                  Transit
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                            Express Service
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Delivery ETA
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {c.delivery_eta}
                          </p>
                        </div>
                      </div>

                      {/* SECTION 3: PRICING & SELECTION */}
                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-4 md:pt-0">
                        <div className="text-right flex flex-col justify-center">
                          {isCheapest && (
                            <div className="mb-1">
                              <span className="text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded-md uppercase animate-pulse">
                                Best Rate
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl font-bold text-gray-900">
                              $
                            </span>
                            <span className="text-3xl font-black text-gray-900 tracking-tighter">
                              {Number(c.price).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                            Price All-in
                          </p>
                        </div>

                        <div
                          className={`flex items-center justify-center h-12 w-12 md:h-14 md:w-32 rounded-xl font-bold text-sm transition-all duration-300 border-2
                    ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-white border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                    }`}
                        >
                          <span className="hidden md:inline">
                            {isSelected ? "SELECTED" : "SELECT"}
                          </span>
                          <span className="md:hidden">
                            {isSelected ? "✓" : "+"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: FINAL DETAILS */}
        {step === 3 && (
          <div className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border">
            <h2 className="font-bold text-xl text-gray-800 border-b pb-4">
              Final Details & Review
            </h2>

            {/* LOCATION SECTION */}
            <section>
              <h3 className="font-semibold text-blue-600 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>{" "}
                Pickup & Delivery
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
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
                <TextareaField
                  name="pickupAddress"
                  label="Pickup Address *"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Full street address for pickup..."
                />
                <TextareaField
                  name="receiverAddress"
                  label="Receiver Address *"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Full street address for delivery..."
                />
              </div>
            </section>

            {/* CARGO REVIEW */}
            <section>
              <h3 className="font-semibold text-blue-600 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Cargo
                Details (Read-only)
              </h3>
              {cargoList.map((cargo, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-7 gap-3 mb-3 border p-3 rounded-xl bg-gray-50/50"
                >
                  <div className="grid grid-cols-2 gap-2 md:col-span-3">
                    <InputField
                      label="Temp"
                      value={cargo.cargoTemp}
                      disabled
                      name="temperature"
                    />
                    <InputField
                      label="Unit"
                      value={cargo.cargoUnit}
                      disabled
                      name="unit"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:col-span-2">
                    <InputField
                      label="Qty"
                      value={cargo.qty}
                      disabled
                      name="qty"
                    />
                    <InputField
                      label="Weight"
                      value={cargo.weight}
                      disabled
                      name="weight"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <InputField
                      label="L"
                      value={cargo.length}
                      disabled
                      name="length"
                    />
                    <InputField
                      label="W"
                      value={cargo.width}
                      disabled
                      name="width"
                    />
                    <InputField
                      label="H"
                      value={cargo.height}
                      disabled
                      name="height"
                    />
                  </div>
                </div>
              ))}

              <div className="bg-blue-50/50 p-4 rounded-xl flex flex-wrap gap-8 border border-blue-100 mt-4">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">
                    Total Qty
                  </p>
                  <p className="font-bold">{totalQty} Units</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">
                    Total Weight
                  </p>
                  <p className="font-bold">{totalWeight} kg</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">
                    Volume (CBM)
                  </p>
                  <p className="font-bold">{totalCBM.toFixed(3)} m³</p>
                </div>
              </div>
            </section>

            {/* PREMIUM CARRIER CARD */}
            <section>
              <h3 className="font-semibold text-blue-600 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>{" "}
                Selected Carrier
              </h3>
              <div className="bg-white border-2 border-blue-500 rounded-2xl overflow-hidden shadow-md">
                <div className="bg-blue-500 px-4 py-1">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Confirmed Option
                  </span>
                </div>
                <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full md:w-[30%]">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 border border-gray-100 shadow-sm">
                      <img
                        src={`/assets/carrier_logo/${selectedCarrier?.carrier_code || "default"}.webp`}
                        alt={selectedCarrier?.name}
                        className="object-contain w-full h-full"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "/assets/carrier_logo/default.webp")
                        }
                      />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-xl leading-tight uppercase italic tracking-tighter">
                        {selectedCarrier?.name}
                      </h3>
                      <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded font-bold uppercase">
                        {selectedCarrier?.carrier_code}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-center gap-6 w-full max-w-md px-10">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase">
                        Pickup
                      </p>
                      <p className="text-xs font-bold text-gray-800">
                        {selectedCarrier?.pickup_eta} days
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
                      <p className="text-[8px] font-black text-gray-400 uppercase">
                        Arrival
                      </p>
                      <p className="text-xs font-bold text-gray-800">
                        {selectedCarrier?.delivery_eta} days
                      </p>
                    </div>
                  </div>

                  <div className="text-right w-full md:w-auto border-t md:border-0 pt-4 md:pt-0">
                    <div className="flex items-baseline justify-end">
                      <span className="text-sm font-bold text-gray-400 mr-1">
                        $
                      </span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">
                        {Number(selectedCarrier?.price).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-blue-600 uppercase">
                      Total All-in Price
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* RECEIVER INFO */}
            <section className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
              <h3 className="font-semibold text-gray-700 mb-4 uppercase text-xs tracking-widest">
                Receiver & Scheduling
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <InputField
                  name="pickupDate"
                  type="date"
                  label="Pickup Date *"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={getTomorrowDate()}
                />
                <InputField
                  name="receiverName"
                  label="Receiver Name *"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Full Name"
                />
                <InputField
                  label="Receiver Phone *"
                  name="pickupPhone"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="+61..."
                />
              </div>
            </section>
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
                  onClick={() => handleEdit("Entry")}
                  className="px-6 py-2 rounded-lg w-50"
                  variant="yellow"
                >
                  Edit & Save Quote
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
                onClick={handleBackFirstStep}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg"
                variant="secondary"
              >
                Back
              </Button>

              {/* RIGHT */}
              <Button
                onClick={() => handleEdit("Booking")}
                className="bg-blue-400 hover:bg-blue-500 text-black px-12 py-3 rounded-lg text-base"
              >
                Submit Quote
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
