"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coffee,
  Package,
  Calculator,
  ClipboardList,
  Crown,
} from "lucide-react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bahan-baku", label: "Bahan Baku", icon: Package },
  { href: "/produk", label: "Produk", icon: Coffee },
  { href: "/kalkulator", label: "Kalkulator HPP", icon: Calculator },
  { href: "/produksi", label: "Riwayat Produksi", icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-brand-dark text-white flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-xl font-bold text-gold">SULTAN</h1>
            <p className="text-xs text-white/60 tracking-wider">KOPI HPP SYSTEM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-gold text-brand-dark font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          Kopi Sultan &copy; 2026
        </p>
      </div>
    </aside>
  );
}
