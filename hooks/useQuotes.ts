"use client";

import { useEffect, useState } from "react";

interface Quote {
  id: number;
  connote_no: string;
  carrierDetail: {
    carrier_name?: string;
    carrier_code?: string;
    image_path?: string;
  };
  cbm: string;
  originArea?: {
    suburb?: string;
  };

  destinationArea?: {
    suburb?: string;
  };
  suburb_origin: string;
  suburb_destination: string;
  total_qty: number;
  total_weight: number;
  status: string;
  customer_code: string;
  user_inp: string;
  createdAt: string;
  updatedAt: string;
}

interface QuoteResponse {
  data: Quote[];
  total: number;
  page: number;
  totalPages: number;
}

interface Params {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
  startDate?: string;
  endDate?: string;
  statusList?: string[]; // 🔥 NEW
}

export default function useQuotes(params: Params) {
  const [data, setData] = useState<QuoteResponse>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);

  // 🔹 destructure biar dependency lebih clean
  const {
    page,
    limit,
    search,
    status,
    sortBy,
    order,
    startDate,
    endDate,
    statusList,
  } = params;

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams();

        const queryParams = {
          page,
          limit,
          search,
          status,
          sortBy,
          order,
          startDate,
          endDate,
        };

        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            query.append(key, String(value));
          }
        });
        // 🔥 append multi status (dipisah biar clean)
        if (statusList && statusList.length > 0) {
          query.append("statusList", statusList.join(","));
        }
        const res = await fetch(`/api/quotes?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("API error");

        const result: QuoteResponse = await res.json();

        setData(result);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Fetch error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 🔥 cleanup (hindari memory leak)
    return () => controller.abort();
  }, [
    page,
    limit,
    search,
    status,
    sortBy,
    order,
    startDate,
    endDate,
    JSON.stringify(statusList),
  ]);

  return { ...data, loading };
}
