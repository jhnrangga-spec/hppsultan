"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  LayoutDashboard,
  Coffee,
  Package,
  Calculator,
  ClipboardList,
  Crown,
  Menu,
  X,
  Landmark,
  FileText,
  LogOut,
  Wallet,
  ShoppingCart,
} from "lucide-react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/aset", label: "Aset Modal", icon: Landmark },
  { href: "/bahan-baku", label: "Bahan Baku", icon: Package },
  { href: "/produk", label: "Produk", icon: Coffee },
  { href: "/kalkulator", label: "Kalkulator HPP", icon: Calculator },
  { href: "/produksi", label: "Riwayat Produksi", icon: ClipboardList },
  { href: "/penjualan", label: "Penjualan", icon: ShoppingCart },
  { href: "/pengeluaran", label: "Pengeluaran", icon: Wallet },
  { href: "/laporan", label: "Laporan", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-brand-dark text-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-brand-dark text-white flex flex-col shadow-xl z-50 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-gold" />
            <div>
              <h1 className="text-xl font-bold text-gold">SULTAN</h1>
              <p className="text-xs text-white/60 tracking-wider">
                KOPI HPP SYSTEM
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-brand text-white font-semibold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          {user && (
            <>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </>
          )}
          <p className="text-xs text-white/40 text-center">
            Kopi Sultan &copy; 2026
          </p>
        </div>
      </aside>
    </>
  );
}
