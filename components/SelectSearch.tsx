"use client";

import dynamic from "next/dynamic";

const AsyncSelect = dynamic(() => import("react-select/async"), {
  ssr: false,
});

type OptionType = {
  label: string;
  value: string | null;
  area_code: string;
  postcode: string;
  zone_type: string;
};

type ApiItem = {
  suburb: string;
  state: string;
  area_code: string;
  postcode: string;
  zone_type: string;
};

type Props = {
  label: string;
  error?: boolean;
  value?: OptionType | null;
  onChange?: (value: OptionType | null) => void;
};

export default function SelectSearch({ label, error, value, onChange }: Props) {
  const loadOptions = async (inputValue: string): Promise<OptionType[]> => {
    try {
      const res = await fetch(
        `/api/coverage-areas?search=${encodeURIComponent(inputValue)}`,
      );

      const data: ApiItem[] = await res.json();

      return data.map((item) => ({
        label: `${item.suburb}, ${item.state}, ${item.postcode}`,
        value: item.suburb,
        area_code: item.area_code,
        postcode: item.postcode,
        zone_type: item.zone_type,
        state: item.state,
      }));
    } catch (err) {
      console.error("Failed load suburb:", err);
      return [];
    }
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">
        {label}
      </label>

      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        value={value}
        onChange={(val) => onChange?.(val as OptionType | null)}
        placeholder="Search suburb..."
        classNamePrefix="react-select"
        styles={{
          control: (base, stateSelect) => ({
            ...base,
            backgroundColor: "#F4F6FA",
            padding: "3px", // px-4 py-2
            borderRadius: "0.5rem", // rounded-lg
            borderWidth: "1px",
            borderColor: error ? "#ef4444" : "#9ca3af", // red-500 : gray-400
            boxShadow: stateSelect.isFocused
              ? error
                ? "0 0 0 2px #ef4444" // focus:ring-red-500
                : "0 0 0 2px #3b82f6" // focus:ring-blue-500
              : "none",
            "&:hover": {
              borderColor: error ? "#ef4444" : "#6b7280",
            },
          }),
        }}
      />
    </div>
  );
}
