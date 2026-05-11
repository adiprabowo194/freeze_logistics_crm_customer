"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { token } = useParams();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch("/api/auth/validate-token", {
          method: "POST",
          body: JSON.stringify({ token, email }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          setValid(false);
        } else {
          setValid(true);
        }
      } catch (err) {
        setValid(false);
      } finally {
        setLoading(false);
      }
    };
    if (token && email) checkToken();
  }, [token, email]);

  const handleReset = async () => {
    if (!password) return toast.error("Password tidak boleh kosong");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok) return toast.error(data.error);

    toast.success("Password berhasil diubah");
    setTimeout(() => router.push("/login"), 2000);
  };

  // Komponen Wrapper untuk menjaga konsistensi UI
  const StatusWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-[400px] text-center space-y-6 iten">
        <div className="flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <StatusWrapper>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Memvalidasi token...</p>
        </div>
      </StatusWrapper>
    );
  }

  if (!valid) {
    return (
      <StatusWrapper>
        <div className="space-y-4">
          <div className="text-red-500 text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800">Invalid Token</h2>
          <p className="text-sm text-gray-500">
            The password reset link may have expired or is no longer valid.
          </p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold"
          >
            Request New Link
          </button>
          <a
            href="/login"
            className="block text-sm text-blue-600 hover:underline"
          >
            Back to Login
          </a>
        </div>
      </StatusWrapper>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Toaster />
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-[400px] space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-sm text-gray-500">Please Type New Password</p>
        </div>

        <div className="space-y-4">
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password baru"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Icon Mata */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[32px] text-gray-500 hover:text-blue-600 transition-colors"
            >
              <i
                className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
              ></i>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition duration-200"
          >
            Reset Password
          </button>
        </div>

        <div className="flex flex-col items-center space-y-2 pt-2 border-t">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:underline font-medium mt-4"
          >
            ← Kembali ke Login
          </a>
          <a
            href="https://www.freezelogistics.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            www.freezelogistics.com.au
          </a>
        </div>
      </div>
    </div>
  );
}
