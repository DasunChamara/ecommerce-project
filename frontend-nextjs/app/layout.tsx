import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Lanka Food City Online | Supermarket & Premium Spices",
  description:
    "Your everyday online food city: fresh groceries, daily provisions, household essentials and premium Ceylon cinnamon, delivered to Colombo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}>
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-green-100 bg-white py-8 text-center text-sm text-gray-500">
          © 2026 Lanka Food City Online. Colombo, Sri Lanka.
        </footer>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
