"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation"; // Tambahkan useRouter
import toast, { Toaster } from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");

  // ========================
  // VALIDATE TOKEN
  // ========================
  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch("/api/auth/validate-token", {
          method: "POST",
          body: JSON.stringify({ token, email }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error);
          setValid(false);
        } else {
          setValid(true);
        }
      } catch (err) {
        toast.error("Error");
      } finally {
        setLoading(false);
      }
    };

    if (token && email) {
      checkToken();
    }
  }, [token, email]);

  // ========================
  // RESET PASSWORD
  // ========================
  const handleReset = async () => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) return toast.error(data.error);

    toast.success("Password berhasil diubah");

    // Redirect ke halaman login setelah 2 detik
    setTimeout(() => {
      router.push("/login"); // atau "/" sesuai keinginan Anda
    }, 2000);
  };

  if (loading) return <div>Loading...</div>;

  if (!valid) return <div>Token tidak valid / expired</div>;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Toaster />

      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
        <h1 className="text-xl font-bold">Reset Password</h1>

        <input
          type="password"
          placeholder="Password baru"
          className="w-full p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
