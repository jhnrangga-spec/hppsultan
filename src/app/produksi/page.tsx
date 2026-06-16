"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { Produksi } from "@/lib/supabase";
import { ClipboardList, Trash2, AlertCircle, X } from "lucide-react";

export default function ProduksiPage() {
  const [items, setItems] = useState<Produksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("produksi")
      .select("*, produk(*)")
      .order("tanggal", { ascending: false });
    if (err) {
      setError("Gagal memuat data: " + err.message);
    }
    setItems((data as Produksi[]) || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus data produksi ini?")) return;
    const { error: err } = await supabase
      .from("produksi")
      .delete()
      .eq("id", id);
    if (err) {
      setError("Gagal menghapus: " + err.message);
      return;
    }
    loadData();
  }

  const totalProduksi = items.reduce((s, p) => s + p.jumlah_produksi, 0);
  const totalHPP = items.reduce((s, p) => s + p.total_hpp, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="w-8 h-8 text-gold" />
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">
            Riwayat Produksi
          </h1>
          <p className="text-brand/60">Semua catatan produksi dan HPP</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <p className="text-sm text-brand/50">Total Batch</p>
            <p className="text-2xl font-bold text-brand-dark">{items.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <p className="text-sm text-brand/50">Total Unit</p>
            <p className="text-2xl font-bold text-brand-dark">
              {totalProduksi}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <p className="text-sm text-brand/50">Total HPP</p>
            <p className="text-2xl font-bold text-brand">
              {formatRupiah(totalHPP)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-brand/10">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-brand/40">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada riwayat produksi.</p>
            <p className="text-sm mt-1">
              Gunakan Kalkulator HPP untuk mencatat produksi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-dark/5">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Tanggal
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Produk
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Jumlah
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Bahan Baku
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Tenaga Kerja
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Overhead
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Total HPP
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    HPP/Unit
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-brand/5">
                    <td className="px-6 py-4 text-sm">
                      {formatDate(p.tanggal)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {p.produk?.nama || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {p.jumlah_produksi}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatRupiah(p.total_biaya_bahan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatRupiah(p.biaya_tenaga_kerja)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatRupiah(p.biaya_overhead)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">
                      {formatRupiah(p.total_hpp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-gold">
                      {formatRupiah(p.hpp_per_unit)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
