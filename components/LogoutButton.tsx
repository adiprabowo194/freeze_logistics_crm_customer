"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      toast.success("Thanks 👋");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      toast.error("Logout Failed");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 text-white  gap-2 flex rounded-xl text-xs"
    >
      <i className="ri-logout-circle-r-line"></i>
      Logout
    </button>
  );
}
