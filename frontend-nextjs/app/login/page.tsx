"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShoppingBasket } from "lucide-react";
import toast from "react-hot-toast";
import { authApi, setToken } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Backend එකට Email සහ Password යැවීම
      const res = await (authApi as any).login({
        email: email.trim(),
        password: password.trim(),
      });

      // 2. 🚀 Token එකක් තිබුණත් නැතත් ස්ථිර Token එකක් LocalStorage එකේ Save කිරීම:
      const token = res.token || `session-token-${res.userId || res.id || 1}`;
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res));

      // 3. Navbar එකට සහ මුළු System එකටම Login වූ බවට Events යැවීම:
      window.dispatchEvent(new Event("auth:updated"));
      window.dispatchEvent(new Event("storage"));

      toast.success("සාර්ථකව Login විය! Welcome back.");

      // 4. Role එක අනුව නිවැරදි පිටුවට යොමු කිරීම:
      if (res.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const msg = err.body?.message || err.message || "Incorrect email or password.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-green-100 p-8 shadow-lg">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-green-100 text-green-700 rounded-2xl mb-3">
            <ShoppingBasket className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-green-950">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Lanka Food City Online</p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-md transition disabled:bg-gray-300"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          New to Lanka Food City?{" "}
          <Link href="/register" className="font-bold text-green-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}