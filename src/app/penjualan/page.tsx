"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { Penjualan, Produk } from "@/lib/supabase";
import { ShoppingCart, Plus, Trash2, X, AlertCircle } from "lucide-react";

export default function PenjualanPage() {
  const [items, setItems] = useState<Penjualan[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterBulan, setFilterBulan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [form, setForm] = useState({
    produk_id: "",
    jumlah: "",
    harga_jual: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  async function loadData() {
    setLoading(true);
    setError(null);

    const startDate = `${filterBulan}-01`;
    const endParts = filterBulan.split("-");
    const lastDay = new Date(parseInt(endParts[0]), parseInt(endParts[1]), 0).getDate();
    const endDate = `${filterBulan}-${lastDay}`;

    const [penjualanRes, produkRes] = await Promise.all([
      supabase
        .from("penjualan")
        .select("*, produk(*)")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: false }),
      supabase.from("produk").select("*").order("nama"),
    ]);

    if (penjualanRes.error) {
      setError("Gagal memuat data: " + penjualanRes.error.message);
      setItems([]);
    } else {
      setItems((penjualanRes.data as Penjualan[]) || []);
    }
    setProdukList((produkRes.data as Produk[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [filterBulan]);

  function openAdd() {
    setForm({
      produk_id: produkList[0]?.id || "",
      jumlah: "",
      harga_jual: produkList[0]?.harga_jual?.toString() || "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
    });
    setShowForm(true);
    setError(null);
  }

  function handleProdukChange(produkId: string) {
    const produk = produkList.find((p) => p.id === produkId);
    setForm({
      ...form,
      produk_id: produkId,
      harga_jual: produk?.harga_jual?.toString() || form.harga_jual,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const jumlah = parseFloat(form.jumlah);
    const hargaJual = parseFloat(form.harga_jual);
    const produk = produkList.find((p) => p.id === form.produk_id);

    const payload = {
      produk_id: form.produk_id,
      jumlah,
      harga_jual: hargaJual,
      total: jumlah * hargaJual,
      tanggal: form.tanggal,
      keterangan: form.keterangan,
    };

    const { error: err } = await supabase.from("penjualan").insert(payload);

    if (err) {
      setSubmitting(false);
      setError("Gagal menyimpan: " + err.message);
      return;
    }

    if (produk) {
      const { data: freshProduk } = await supabase.from("produk").select("stok").eq("id", form.produk_id).single();
      const currentStok = freshProduk?.stok || 0;
      const newStok = Math.max(0, currentStok - jumlah);
      await supabase.from("produk").update({ stok: newStok }).eq("id", form.produk_id);
      await supabase.from("mutasi_stok").insert({
        tipe: "produk",
        item_id: form.produk_id,
        item_nama: produk.nama,
        jenis: "keluar",
        jumlah,
        satuan: "unit",
        saldo_akhir: newStok,
        referensi: "Penjualan",
        tanggal: form.tanggal,
        keterangan: form.keterangan || `${jumlah} unit @ ${formatRupiah(hargaJual)}`,
      });
    }

    setSubmitting(false);
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus data penjualan ini?")) return;

    const item = items.find((i) => i.id === id);
    const { error: err } = await supabase
      .from("penjualan")
      .delete()
      .eq("id", id);
    if (err) {
      setError("Gagal menghapus: " + err.message);
      return;
    }

    if (item) {
      const { data: freshProduk } = await supabase.from("produk").select("stok").eq("id", item.produk_id).single();
      const currentStok = freshProduk?.stok || 0;
      const newStok = currentStok + item.jumlah;
      await supabase.from("produk").update({ stok: newStok }).eq("id", item.produk_id);
      await supabase.from("mutasi_stok").insert({
        tipe: "produk",
        item_id: item.produk_id,
        item_nama: item.produk?.nama || "-",
        jenis: "masuk",
        jumlah: item.jumlah,
        satuan: "unit",
        saldo_akhir: newStok,
        referensi: "Batal Penjualan",
        tanggal: item.tanggal,
        keterangan: `Hapus data penjualan`,
      });
    }

    loadData();
  }

  const totalPendapatan = items.reduce((s, p) => s + p.total, 0);
  const totalUnit = items.reduce((s, p) => s + p.jumlah, 0);

  const bulanLabel = new Date(filterBulan + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const jumlahForm = parseFloat(form.jumlah) || 0;
  const hargaForm = parseFloat(form.harga_jual) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Penjualan</h1>
            <p className="text-white/60">Catat penjualan produk</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          disabled={produkList.length === 0}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Tambah Penjualan
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm text-white/60">Bulan:</label>
        <input
          type="month"
          value={filterBulan}
          onChange={(e) => setFilterBulan(e.target.value)}
          className="border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Total Pendapatan</p>
          <p className="text-2xl font-bold text-emerald-400">{formatRupiah(totalPendapatan)}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Unit Terjual</p>
          <p className="text-2xl font-bold text-foreground">{totalUnit}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Transaksi</p>
          <p className="text-2xl font-bold text-gold">{items.length}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cream rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Tambah Penjualan</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Produk</label>
                <select
                  value={form.produk_id}
                  onChange={(e) => handleProdukChange(e.target.value)}
                  required
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — {formatRupiah(p.harga_jual)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Jumlah (unit)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                    className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Harga Jual / unit</label>
                  <input
                    type="number"
                    required
                    step="1"
                    value={form.harga_jual}
                    onChange={(e) => setForm({ ...form, harga_jual: e.target.value })}
                    className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Keterangan</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  rows={2}
                  placeholder="Opsional (misal: nama pembeli, marketplace)"
                />
              </div>

              {jumlahForm > 0 && hargaForm > 0 && (
                <div className="bg-background rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Total:</span>
                    <span className="font-bold text-lg text-emerald-400">
                      {formatRupiah(jumlahForm * hargaForm)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-white/20 text-white/70 px-4 py-2.5 rounded-lg hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-cream rounded-xl shadow-sm border border-white/10">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada penjualan bulan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Tanggal</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Produk</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Qty</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Harga/Unit</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Total</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm">{formatDate(item.tanggal)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{item.produk?.nama || "-"}</span>
                      {item.keterangan && (
                        <p className="text-xs text-white/40 mt-0.5">{item.keterangan}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">{item.jumlah}</td>
                    <td className="px-6 py-4 text-sm text-right">{formatRupiah(item.harga_jual)}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-400">
                      {formatRupiah(item.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5">
                <tr>
                  <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-foreground text-right">
                    TOTAL
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right">{totalUnit}</td>
                  <td />
                  <td className="px-6 py-3 text-sm font-bold text-right text-emerald-400">
                    {formatRupiah(totalPendapatan)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
