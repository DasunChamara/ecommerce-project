"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Lock, 
  Mail, 
  MapPin, 
  Navigation, 
  Phone, 
  ShoppingBasket 
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // GPS Location auto-detect කිරීම
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        toast.success("GPS Location detected!");
        setLocating(false);
      },
      () => {
        toast.error("Could not retrieve GPS location. Please allow permissions.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await (authApi as any).register({
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
        deliveryAddress: deliveryAddress.trim(),
        latitude: latitude || 6.9271, // Colombo default if null
        longitude: longitude || 79.8612,
      });

      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
    } catch (err: any) {
      const msg = err.body?.message || err.message || "Registration failed. Try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-green-100 p-8 shadow-lg">
        
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-green-100 text-green-700 rounded-2xl mb-2">
            <ShoppingBasket className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-green-950">Create an Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join Lanka Food City Online</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email (Required) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-600"
              />
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Phone Number (Required) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0771234567"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-600"
              />
              <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Password (Required) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-600"
              />
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Delivery Address (Required) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Delivery Address *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="No 45, Galle Road, Colombo"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-600"
              />
              <Building className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* GPS Location Button */}
          <div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-green-600 text-green-700 bg-green-50 text-xs font-bold hover:bg-green-100 transition"
            >
              <Navigation className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`} />
              <span>{latitude ? "GPS Location Saved (Lat/Long)" : "Detect My GPS Location"}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm shadow-md transition disabled:bg-gray-300"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-green-700 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}