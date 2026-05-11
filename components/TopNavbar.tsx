"use client";

import { useEffect, useState } from "react";

import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

function TopNavbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();
      setUser(data);
    };

    fetchUser();
  }, []);

  return (
    <div>
      {" "}
      <div className="topNavbar flex justify-between items-center px-8 border-1 border-gray-300 bg-white">
        <div className="w-1/2 px-6">
          <Logo width={180} height={180} />
        </div>
        <div className="w-1/2 py-4 px-6 ">
          <div className="flex justify-end items-center gap-4">
            <span className="text-gray-500 text-xs/tight text-end">
              Welcome , {user?.full_name || user?.username || "Guest"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopNavbar;
