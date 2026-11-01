"use client";

import { usePathname } from "next/navigation";

/** Customer-store footer; hidden inside the Admin Portal. */
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-green-100 bg-white py-8 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} Lanka Food City Online. Colombo, Sri Lanka.
    </footer>
  );
}
