"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { BahanBaku, Produk, MutasiStok } from "@/lib/supabase";
import {
  Warehouse,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  ShoppingBag,
} from "lucide-react";

export default function GudangPage() {
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [produk, setProduk] = useState<Produk[]>([]);
  const [mutasi, setMutasi] = useState<MutasiStok[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [resBahan, resProduk, resMutasi] = await Promise.all([
        supabase.from("bahan_baku").select("*").order("nama"),
        supabase.from("produk").select("*").order("nama"),
        supabase
          .from("mutasi_stok")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setBahanBaku((resBahan.data as BahanBaku[]) || []);
      setProduk((resProduk.data as Produk[]) || []);
      setMutasi((resMutasi.data as MutasiStok[]) || []);
      setLoading(false);
    }
    loadData();
  }, []);

  // Stok calculations
  const stokMenipisBahan = bahanBaku.filter(
    (b) => b.stok_minimum > 0 && b.stok <= b.stok_minimum && b.stok > 0
  );
  const stokMenipisProduk = produk.filter(
    (p) => p.stok_minimum > 0 && p.stok <= p.stok_minimum && p.stok > 0
  );
  const stokHabisBahan = bahanBaku.filter((b) => b.stok <= 0);
  const stokHabisProduk = produk.filter((p) => p.stok <= 0);

  const totalMenipis = stokMenipisBahan.length + stokMenipisProduk.length;
  const totalHabis = stokHabisBahan.length + stokHabisProduk.length;

  const alertItems = [
    ...stokMenipisBahan.map((b) => ({
      nama: b.nama,
      tipe: "Bahan Baku",
      stok: b.stok,
      minimum: b.stok_minimum,
      satuan: b.satuan,
    })),
    ...stokHabisBahan.map((b) => ({
      nama: b.nama,
      tipe: "Bahan Baku",
      stok: b.stok,
      minimum: b.stok_minimum,
      satuan: b.satuan,
    })),
    ...stokMenipisProduk.map((p) => ({
      nama: p.nama,
      tipe: "Produk",
      stok: p.stok,
      minimum: p.stok_minimum,
      satuan: "pcs",
    })),
    ...stokHabisProduk.map((p) => ({
      nama: p.nama,
      tipe: "Produk",
      stok: p.stok,
      minimum: p.stok_minimum,
      satuan: "pcs",
    })),
  ];

  function getStatusBadge(stok: number, stokMinimum: number) {
    if (stok <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/50">
          Habis
        </span>
      );
    }
    if (stokMinimum > 0 && stok <= stokMinimum) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-700/50">
          Menipis
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/50">
        Aman
      </span>
    );
  }

  function getKemasanDisplay(item: BahanBaku) {
    const isi = item.isi_per_kemasan || 1;
    const berat = item.berat_per_isi || 0;
    const perKemasan = berat > 0 ? isi * berat : isi;
    const jumlahKemasan = perKemasan > 0 ? item.stok / perKemasan : 0;
    return {
      jumlahKemasan: Math.round(jumlahKemasan * 100) / 100,
      satuanBeli: item.satuan_beli || "pack",
      stokResep: item.stok,
      satuanResep: item.satuan,
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Warehouse className="w-8 h-8 text-gold" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gudang & Stok</h1>
          <p className="text-white/60">
            Pantau stok bahan baku & produk jadi
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-cream rounded-xl shadow-sm border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-brand" />
            <span className="text-sm text-white/60">Total Bahan Baku</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{bahanBaku.length}</p>
        </div>
        <div className="bg-cream rounded-xl shadow-sm border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-5 h-5 text-gold" />
            <span className="text-sm text-white/60">Total Produk</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{produk.length}</p>
        </div>
        <div className="bg-cream rounded-xl shadow-sm border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-white/60">Stok Menipis</span>
          </div>
          <p className={`text-3xl font-bold ${totalMenipis > 0 ? "text-red-400" : "text-foreground"}`}>
            {totalMenipis}
          </p>
        </div>
        <div className="bg-cream rounded-xl shadow-sm border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-white/60">Stok Habis</span>
          </div>
          <p className={`text-3xl font-bold ${totalHabis > 0 ? "text-red-400" : "text-foreground"}`}>
            {totalHabis}
          </p>
        </div>
      </div>

      {/* Alert Section */}
      {alertItems.length > 0 && (
        <div className="mb-8 bg-amber-900/20 border border-amber-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-300">
              Peringatan Stok
            </h3>
          </div>
          <div className="space-y-2">
            {alertItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-amber-900/20 rounded-lg px-4 py-2"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {item.nama}
                  </span>
                  <span className="text-xs text-amber-400/70 ml-2">
                    ({item.tipe})
                  </span>
                </div>
                <div className="text-sm">
                  <span className={item.stok <= 0 ? "text-red-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {item.stok} {item.satuan}
                  </span>
                  <span className="text-white/40 mx-2">/</span>
                  <span className="text-white/60">
                    min. {item.minimum} {item.satuan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stok Bahan Baku Table */}
        <div className="bg-cream rounded-xl shadow-sm border border-white/10">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" />
              Stok Bahan Baku
            </h2>
          </div>
          {bahanBaku.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Belum ada bahan baku.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white/70">
                      Nama
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-white/70">
                      Stok
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-white/70">
                      Minimum
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-white/70">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bahanBaku.map((item) => {
                    const display = getKemasanDisplay(item);
                    return (
                      <tr key={item.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-medium">
                          {item.nama}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span>{display.jumlahKemasan} {display.satuanBeli}</span>
                          <p className="text-xs text-white/40">
                            {display.stokResep} {display.satuanResep}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-white/60">
                          {item.stok_minimum} {item.satuan}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(item.stok, item.stok_minimum)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stok Produk Jadi Table */}
        <div className="bg-cream rounded-xl shadow-sm border border-white/10">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold" />
              Stok Produk Jadi
            </h2>
          </div>
          {produk.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Belum ada produk.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-white/70">
                      Nama
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-white/70">
                      Harga Jual
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-white/70">
                      Stok
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-white/70">
                      Minimum
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-white/70">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {produk.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-medium">
                        {item.nama}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gold">
                        {formatRupiah(item.harga_jual)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {item.stok}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white/60">
                        {item.stok_minimum}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(item.stok, item.stok_minimum)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Mutasi */}
      <div className="bg-cream rounded-xl shadow-sm border border-white/10">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-foreground">
            Mutasi Stok Terbaru
          </h2>
        </div>
        {mutasi.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            <p>Belum ada riwayat mutasi stok.</p>
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
                    Item
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-white/70">
                    Jenis
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">
                    Jumlah
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">
                    Saldo Akhir
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">
                    Referensi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mutasi.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5">
                    <td className="px-6 py-3 text-sm text-white/60">
                      {formatDate(m.tanggal)}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">
                      {m.item_nama}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {m.jenis === "masuk" ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <ArrowUpCircle className="w-4 h-4" />
                          Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                          <ArrowDownCircle className="w-4 h-4" />
                          Keluar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-right">
                      {m.jumlah} {m.satuan}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-white/60">
                      {m.saldo_akhir} {m.satuan}
                    </td>
                    <td className="px-6 py-3 text-sm text-white/60">
                      {m.referensi || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
