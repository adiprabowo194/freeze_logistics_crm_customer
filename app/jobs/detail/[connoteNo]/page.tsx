"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import MenuBars from "@/components/MenuBars";
import StatusBadge from "@/components/StatusBadge";

export default function JobDetailPage() {
  const { connoteNo } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/detail/${connoteNo}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, [connoteNo]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!data) return <div className="p-10 text-center">Data not found</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <TopNavbar />
      <MenuBars />

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {data.connote_no}
            </h1>
            <p className="text-gray-500 text-sm">
              Customer : {data.customer_code} -{" "}
              {data.customerQuote.company_name}
            </p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Addresses */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="font-bold mb-4 text-blue-600 flex items-center gap-2">
                <i className="ri-map-pin-2-line"></i> Shipment Route
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Origin
                  </p>
                  <p className="font-bold text-gray-700">
                    {data.originArea?.suburb}, {data.originArea?.state}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.pickup_address}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Destination
                  </p>
                  <p className="font-bold text-gray-700">
                    {data.destinationArea?.suburb},{" "}
                    {data.destinationArea?.state}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.delivery_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Package Details Table */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="font-bold">Item Specifications</h2>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4">Temperature</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-center">Weight</th>
                    <th className="p-4 text-center">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.packageDetails?.map((pkg: any, i: number) => (
                    <tr key={i}>
                      <td className="p-4">{pkg.temperature || "-"}</td>
                      <td className="p-4 text-center">{pkg.qty}</td>
                      <td className="p-4 text-center">{pkg.weight} kg</td>
                      <td className="p-4 text-center">{pkg.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 2: Summary Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="font-bold mb-4 border-b pb-2">Carrier Info</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Carrier</span>
                  <span className="font-bold text-blue-600">
                    {data.carrierDetail?.name || data.carrier}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Service ETA</span>
                  <span className="text-sm font-medium">
                    {data.eta_delivery} Days
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
              <div className="grid grid-cols-2">
                <div>
                  <h2 className="font-medium text-blue-100 text-sm mb-1">
                    Total Weight
                  </h2>
                  <p className="text-3xl font-bold">
                    {data.total_weight} <span className="text-lg">kg</span>
                  </p>
                </div>
                <div>
                  <h2 className="font-medium text-blue-100 text-sm mb-1">
                    Price ALL In
                  </h2>
                  <p className="text-3xl font-bold">$ {data.price_all_in}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-500 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-200 text-[10px] uppercase font-bold tracking-wider">
                    Total Qty
                  </p>
                  <p className="text-lg font-bold">{data.total_qty}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-[10px] uppercase font-bold tracking-wider">
                    Total CBM
                  </p>
                  <p className="text-lg font-bold">{data.total_cbm}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
