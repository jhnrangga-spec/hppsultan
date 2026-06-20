"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import type { Produksi, Aset, BahanBaku, Produk } from "@/lib/supabase";
import {
  Coffee,
  Package,
  TrendingUp,
  DollarSign,
  Crown,
  AlertCircle,
  AlertTriangle,
  X,
  Landmark,
  Wallet,
} from "lucide-react";

export default function Dashboard() {
  const [produksiList, setProduksiList] = useState<Produksi[]>([]);
  const [asetList, setAsetList] = useState<Aset[]>([]);
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    const [produksiRes, bahanRes, produkRes, asetRes] = await Promise.all([
      supabase
        .from("produksi")
        .select("*, produk(*)")
        .order("tanggal", { ascending: false })
        .limit(10),
      supabase.from("bahan_baku").select("*").order("nama"),
      supabase.from("produk").select("*").order("nama"),
      supabase.from("aset").select("*").order("created_at", { ascending: false }),
    ]);

    if (produksiRes.error) {
      setError("Gagal memuat data: " + produksiRes.error.message);
    }
    setProduksiList((produksiRes.data as Produksi[]) || []);
    setBahanList((bahanRes.data as BahanBaku[]) || []);
    setProdukList((produkRes.data as Produk[]) || []);
    setAsetList((asetRes.data as Aset[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalProduksi = produksiList.reduce(
    (sum, p) => sum + p.jumlah_produksi,
    0
  );
  const totalHPP = produksiList.reduce((sum, p) => sum + p.total_hpp, 0);
  const avgHPP =
    produksiList.length > 0
      ? totalHPP / produksiList.reduce((s, p) => s + p.jumlah_produksi, 0)
      : 0;

  const totalModal = asetList.reduce((s, a) => s + a.total_harga, 0);
  const penyusutanPerBulan = asetList.reduce(
    (s, a) => s + a.total_harga / a.umur_ekonomis / 12,
    0
  );

  const stokMenipis = [
    ...bahanList.filter((b) => b.stok_minimum > 0 && b.stok <= b.stok_minimum && b.stok > 0).map((b) => ({ nama: b.nama, stok: b.stok, min: b.stok_minimum, satuan: b.satuan, tipe: "Bahan Baku" })),
    ...produkList.filter((p) => p.stok_minimum > 0 && p.stok <= p.stok_minimum && p.stok > 0).map((p) => ({ nama: p.nama, stok: p.stok, min: p.stok_minimum, satuan: "unit", tipe: "Produk" })),
  ];
  const stokHabis = [
    ...bahanList.filter((b) => b.stok <= 0).map((b) => ({ nama: b.nama, tipe: "Bahan Baku" })),
    ...produkList.filter((p) => p.stok <= 0).map((p) => ({ nama: p.nama, tipe: "Produk" })),
  ];

  const stats = [
    {
      label: "Total Modal Awal",
      value: formatRupiah(totalModal),
      icon: Landmark,
      color: "bg-orange-900/30 text-amber-300",
    },
    {
      label: "Penyusutan/Bulan",
      value: formatRupiah(penyusutanPerBulan),
      icon: Wallet,
      color: "bg-red-900/30 text-red-400",
    },
    {
      label: "Total Bahan Baku",
      value: bahanList.length.toString(),
      icon: Package,
      color: "bg-amber-900/30 text-amber-300",
    },
    {
      label: "Total Produk",
      value: produkList.length.toString(),
      icon: Coffee,
      color: "bg-emerald-900/30 text-emerald-300",
    },
    {
      label: "Unit Diproduksi",
      value: totalProduksi.toString(),
      icon: TrendingUp,
      color: "bg-blue-900/30 text-blue-300",
    },
    {
      label: "Rata-rata HPP/Unit",
      value: formatRupiah(avgHPP),
      icon: DollarSign,
      color: "bg-purple-900/30 text-purple-300",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Crown className="w-8 h-8 text-gold" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-white/60">Sistem HPP Kopi Brand Sultan</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-200 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-cream rounded-xl p-6 shadow-sm border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-white/50 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {(stokMenipis.length > 0 || stokHabis.length > 0) && (
        <div className="mb-8 bg-amber-900/30 border border-amber-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-300">Peringatan Stok</h3>
          </div>
          <div className="space-y-2">
            {stokHabis.map((item, i) => (
              <div key={`habis-${i}`} className="flex items-center justify-between bg-red-900/30 rounded-lg px-4 py-2">
                <span className="text-sm font-medium">{item.nama} <span className="text-xs text-white/40">({item.tipe})</span></span>
                <span className="text-xs font-bold text-red-400">HABIS</span>
              </div>
            ))}
            {stokMenipis.map((item, i) => (
              <div key={`menipis-${i}`} className="flex items-center justify-between bg-amber-900/20 rounded-lg px-4 py-2">
                <span className="text-sm font-medium">{item.nama} <span className="text-xs text-white/40">({item.tipe})</span></span>
                <span className="text-xs text-amber-400">Stok: {item.stok} {item.satuan} (min: {item.min})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cream rounded-xl shadow-sm border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-foreground">
              Riwayat Produksi Terbaru
            </h2>
          </div>
          {produksiList.length === 0 ? (
            <div className="p-12 text-center text-white/40">
              <Coffee className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Belum ada data produksi.</p>
              <p className="text-sm mt-1">
                Mulai dengan menambahkan bahan baku dan produk.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-white/70">
                      Tanggal
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-white/70">
                      Produk
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-white/70">
                      Jumlah
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-white/70">
                      HPP/Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand/5">
                  {produksiList.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm">
                        {new Date(p.tanggal).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {p.produk?.nama || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {p.jumlah_produksi}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-brand font-medium">
                        {formatRupiah(p.hpp_per_unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-cream rounded-xl shadow-sm border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-foreground">
              Ringkasan Aset Modal
            </h2>
          </div>
          {asetList.length === 0 ? (
            <div className="p-12 text-center text-white/40">
              <Landmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Belum ada data aset.</p>
              <p className="text-sm mt-1">
                Tambahkan peralatan dan mesin di halaman Aset Modal.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {asetList.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-cream rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="font-medium text-sm">{a.nama}</span>
                    <span className="text-xs text-white/40 ml-2">
                      {a.kategori}
                    </span>
                  </div>
                  <span className="font-semibold text-sm text-brand">
                    {formatRupiah(a.total_harga)}
                  </span>
                </div>
              ))}
              {asetList.length > 8 && (
                <p className="text-xs text-center text-white/40">
                  +{asetList.length - 8} aset lainnya
                </p>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="font-semibold text-foreground">
                  Total Modal Awal
                </span>
                <span className="font-bold text-lg text-gold">
                  {formatRupiah(totalModal)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
