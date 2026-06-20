"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import type { MutasiStok } from "@/lib/supabase";
import { ArrowLeftRight, ArrowUp, ArrowDown, AlertCircle, X } from "lucide-react";

type TipeFilter = "semua" | "bahan_baku" | "produk";
type JenisFilter = "semua" | "masuk" | "keluar";

export default function MutasiPage() {
  const [mutasiList, setMutasiList] = useState<MutasiStok[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipeFilter, setTipeFilter] = useState<TipeFilter>("semua");
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>("semua");
  const [bulanFilter, setBulanFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("mutasi_stok")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError("Gagal memuat data: " + err.message);
    setMutasiList((data as MutasiStok[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = mutasiList.filter((m) => {
    if (tipeFilter !== "semua" && m.tipe !== tipeFilter) return false;
    if (jenisFilter !== "semua" && m.jenis !== jenisFilter) return false;
    if (bulanFilter) {
      const itemMonth = m.tanggal.slice(0, 7);
      if (itemMonth !== bulanFilter) return false;
    }
    return true;
  }).sort((a, b) => {
    const tglCmp = b.tanggal.localeCompare(a.tanggal);
    if (tglCmp !== 0) return tglCmp;
    return b.created_at.localeCompare(a.created_at);
  });

  const totalMasuk = filtered.filter((m) => m.jenis === "masuk").length;
  const totalKeluar = filtered.filter((m) => m.jenis === "keluar").length;
  const totalTransaksi = filtered.length;

  const tipeTabs: { key: TipeFilter; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "bahan_baku", label: "Bahan Baku" },
    { key: "produk", label: "Produk" },
  ];

  const jenisTabs: { key: JenisFilter; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "masuk", label: "Masuk" },
    { key: "keluar", label: "Keluar" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ArrowLeftRight className="w-8 h-8 text-gold" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mutasi Stok</h1>
          <p className="text-white/60">Riwayat keluar-masuk stok bahan baku &amp; produk</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-cream rounded-xl shadow-sm border border-white/10 mb-6">
        <div className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {tipeTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTipeFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tipeFilter === tab.key
                    ? "bg-brand text-white"
                    : "text-white/60 hover:text-brand hover:bg-cream"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {jenisTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setJenisFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  jenisFilter === tab.key
                    ? "bg-brand text-white"
                    : "text-white/60 hover:text-brand hover:bg-cream"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <input
              type="month"
              value={bulanFilter}
              onChange={(e) => setBulanFilter(e.target.value)}
              className="border border-white/20 rounded-lg px-3 py-1.5 text-sm bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-1">Total Masuk</p>
          <p className="text-2xl font-bold text-emerald-400">{totalMasuk}</p>
        </div>
        <div className="bg-red-900/30 border border-red-700/30 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-1">Total Keluar</p>
          <p className="text-2xl font-bold text-red-400">{totalKeluar}</p>
        </div>
        <div className="bg-cream border border-white/10 rounded-xl p-4">
          <p className="text-sm text-white/60 mb-1">Total Transaksi</p>
          <p className="text-2xl font-bold text-foreground">{totalTransaksi}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-cream rounded-xl shadow-sm border border-white/10 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ArrowLeftRight className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/50 font-medium">Belum ada mutasi stok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/70">
                    <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium">Item</th>
                    <th className="text-left px-4 py-3 font-medium">Tipe</th>
                    <th className="text-left px-4 py-3 font-medium">Jenis</th>
                    <th className="text-right px-4 py-3 font-medium">Jumlah</th>
                    <th className="text-right px-4 py-3 font-medium">Saldo Akhir</th>
                    <th className="text-left px-4 py-3 font-medium">Referensi</th>
                    <th className="text-left px-4 py-3 font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white/70">{formatDate(m.tanggal)}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{m.item_nama}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.tipe === "bahan_baku"
                              ? "bg-blue-900/40 text-blue-300"
                              : "bg-purple-900/40 text-purple-300"
                          }`}
                        >
                          {m.tipe === "bahan_baku" ? "Bahan Baku" : "Produk"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.jenis === "masuk"
                              ? "bg-emerald-900/40 text-emerald-300"
                              : "bg-red-900/40 text-red-300"
                          }`}
                        >
                          {m.jenis === "masuk" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {m.jenis === "masuk" ? "Masuk" : "Keluar"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {m.jumlah} {m.satuan}
                      </td>
                      <td className="px-4 py-3 text-right text-white/70">{m.saldo_akhir} {m.satuan}</td>
                      <td className="px-4 py-3 text-white/50">{m.referensi || "-"}</td>
                      <td className="px-4 py-3 text-white/50">{m.keterangan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
