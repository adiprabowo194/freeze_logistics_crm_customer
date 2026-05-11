"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

function TopNavbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setUser(data);
    };
    fetchUser();
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-[110]">
      <div className="flex justify-between items-center px-4 md:px-14 h-16 md:h-20">
        {/* LOGO - Ukuran otomatis mengecil di mobile */}
        <div className="flex-shrink-0">
          <Logo width={150} height={40} className="w-32 md:w-44 h-auto" />
        </div>

        {/* USER INFO & LOGOUT */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase leading-none">
              Welcome
            </span>
            <span className="text-xs md:text-sm font-bold text-gray-700">
              {user?.full_name || user?.username || "Guest"}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

export default TopNavbar;
