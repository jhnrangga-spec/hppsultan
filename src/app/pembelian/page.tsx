"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { Pembelian, BahanBaku } from "@/lib/supabase";
import { Truck, Plus, Trash2, X, AlertCircle } from "lucide-react";

export default function PembelianPage() {
  const [items, setItems] = useState<Pembelian[]>([]);
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterBulan, setFilterBulan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [form, setForm] = useState({
    bahan_baku_id: "",
    jumlah_kemasan: "",
    harga_total: "",
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

    const [pembelianRes, bahanRes] = await Promise.all([
      supabase
        .from("pembelian")
        .select("*, bahan_baku(*)")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: false }),
      supabase.from("bahan_baku").select("*").order("nama"),
    ]);

    if (pembelianRes.error) {
      setError("Gagal memuat data: " + pembelianRes.error.message);
      setItems([]);
    } else {
      setItems((pembelianRes.data as Pembelian[]) || []);
    }
    setBahanList((bahanRes.data as BahanBaku[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [filterBulan]);

  function getSelectedBahan(): BahanBaku | undefined {
    return bahanList.find((b) => b.id === form.bahan_baku_id);
  }

  function calcJumlahSatuan(bahan: BahanBaku | undefined, jumlahKemasan: number): number {
    if (!bahan) return 0;
    if (bahan.berat_per_isi > 0) {
      return jumlahKemasan * bahan.isi_per_kemasan * bahan.berat_per_isi;
    }
    return jumlahKemasan * bahan.isi_per_kemasan;
  }

  function openAdd() {
    const firstBahan = bahanList[0];
    setForm({
      bahan_baku_id: firstBahan?.id || "",
      jumlah_kemasan: "",
      harga_total: "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
    });
    setShowForm(true);
    setError(null);
  }

  function handleBahanChange(bahanId: string) {
    const bahan = bahanList.find((b) => b.id === bahanId);
    const jmlKemasan = parseFloat(form.jumlah_kemasan) || 0;
    setForm({
      ...form,
      bahan_baku_id: bahanId,
      harga_total: bahan && jmlKemasan > 0 ? (jmlKemasan * bahan.harga_beli).toString() : "",
    });
  }

  function handleJumlahKemasanChange(val: string) {
    const bahan = getSelectedBahan();
    const jml = parseFloat(val) || 0;
    setForm({
      ...form,
      jumlah_kemasan: val,
      harga_total: bahan && jml > 0 ? (jml * bahan.harga_beli).toString() : form.harga_total,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const bahan = getSelectedBahan();
    if (!bahan) {
      setError("Bahan baku tidak ditemukan");
      setSubmitting(false);
      return;
    }

    const jumlahKemasan = parseFloat(form.jumlah_kemasan);
    const hargaTotal = parseFloat(form.harga_total);
    const jumlahSatuan = calcJumlahSatuan(bahan, jumlahKemasan);

    // Insert pembelian
    const { error: insertErr } = await supabase.from("pembelian").insert({
      bahan_baku_id: form.bahan_baku_id,
      jumlah_kemasan: jumlahKemasan,
      jumlah_satuan: jumlahSatuan,
      harga_total: hargaTotal,
      tanggal: form.tanggal,
      keterangan: form.keterangan,
    });

    if (insertErr) {
      setError("Gagal menyimpan: " + insertErr.message);
      setSubmitting(false);
      return;
    }

    // Fetch current stok
    const { data: currentBahan, error: fetchErr } = await supabase
      .from("bahan_baku")
      .select("stok")
      .eq("id", bahan.id)
      .single();

    if (fetchErr) {
      setError("Gagal mengambil stok: " + fetchErr.message);
      setSubmitting(false);
      return;
    }

    const currentStok = currentBahan.stok || 0;
    const newStok = currentStok + jumlahSatuan;

    // Update stok
    const { error: updateErr } = await supabase
      .from("bahan_baku")
      .update({ stok: newStok })
      .eq("id", bahan.id);

    if (updateErr) {
      setError("Gagal update stok: " + updateErr.message);
      setSubmitting(false);
      return;
    }

    // Insert mutasi stok
    const { error: mutasiErr } = await supabase.from("mutasi_stok").insert({
      tipe: "bahan_baku",
      item_id: bahan.id,
      item_nama: bahan.nama,
      jenis: "masuk",
      jumlah: jumlahSatuan,
      satuan: bahan.satuan,
      saldo_akhir: newStok,
      referensi: "Pembelian",
      tanggal: form.tanggal,
      keterangan: form.keterangan,
    });

    if (mutasiErr) {
      setError("Gagal mencatat mutasi: " + mutasiErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowForm(false);
    loadData();
  }

  async function handleDelete(item: Pembelian) {
    if (!confirm("Yakin ingin menghapus data pembelian ini?")) return;

    // Delete pembelian
    const { error: delErr } = await supabase
      .from("pembelian")
      .delete()
      .eq("id", item.id);

    if (delErr) {
      setError("Gagal menghapus: " + delErr.message);
      return;
    }

    // Fetch current stok to deduct
    const { data: currentBahan, error: fetchErr } = await supabase
      .from("bahan_baku")
      .select("stok")
      .eq("id", item.bahan_baku_id)
      .single();

    if (fetchErr) {
      setError("Gagal mengambil stok: " + fetchErr.message);
      loadData();
      return;
    }

    const currentStok = currentBahan.stok || 0;
    const newStok = currentStok - item.jumlah_satuan;

    // Deduct stok
    const { error: updateErr } = await supabase
      .from("bahan_baku")
      .update({ stok: newStok })
      .eq("id", item.bahan_baku_id);

    if (updateErr) {
      setError("Gagal update stok: " + updateErr.message);
      loadData();
      return;
    }

    // Insert mutasi stok for reversal
    const bahanNama = item.bahan_baku?.nama || "-";
    const bahanSatuan = item.bahan_baku?.satuan || "-";

    await supabase.from("mutasi_stok").insert({
      tipe: "bahan_baku",
      item_id: item.bahan_baku_id,
      item_nama: bahanNama,
      jenis: "keluar",
      jumlah: item.jumlah_satuan,
      satuan: bahanSatuan,
      saldo_akhir: newStok,
      referensi: "Batal Pembelian",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: `Pembatalan pembelian ${formatDate(item.tanggal)}`,
    });

    loadData();
  }

  const totalPembelian = items.reduce((s, p) => s + p.harga_total, 0);

  const bulanLabel = new Date(filterBulan + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const selectedBahan = getSelectedBahan();
  const jumlahKemasanForm = parseFloat(form.jumlah_kemasan) || 0;
  const jumlahSatuanPreview = calcJumlahSatuan(selectedBahan, jumlahKemasanForm);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pembelian Bahan Baku</h1>
            <p className="text-white/60">Catat pembelian dan update stok otomatis</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          disabled={bahanList.length === 0}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Tambah Pembelian
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
          <p className="text-sm text-white/50">Total Pembelian</p>
          <p className="text-2xl font-bold text-emerald-400">{formatRupiah(totalPembelian)}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Jumlah Transaksi</p>
          <p className="text-2xl font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Bulan</p>
          <p className="text-2xl font-bold text-gold">{bulanLabel}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cream rounded-xl p-6 w-full max-w-md shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Tambah Pembelian</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Bahan Baku</label>
                <select
                  value={form.bahan_baku_id}
                  onChange={(e) => handleBahanChange(e.target.value)}
                  required
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {bahanList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Jumlah Kemasan</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={form.jumlah_kemasan}
                  onChange={(e) => handleJumlahKemasanChange(e.target.value)}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="0"
                />
                {selectedBahan && (
                  <p className="text-xs text-white/40 mt-1">
                    1 {selectedBahan.satuan_beli} = {selectedBahan.isi_per_kemasan} pcs
                    {selectedBahan.berat_per_isi > 0 && (
                      <> &times; {selectedBahan.berat_per_isi}{selectedBahan.satuan}</>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Harga Total</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={form.harga_total}
                  onChange={(e) => setForm({ ...form, harga_total: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="0"
                />
              </div>

              {selectedBahan && jumlahKemasanForm > 0 && (
                <div className="bg-background rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-white/60">
                    Stok akan bertambah:{" "}
                    <span className="font-semibold text-emerald-400">
                      {jumlahSatuanPreview} {selectedBahan.satuan}
                    </span>
                  </p>
                </div>
              )}

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
                  placeholder="Opsional (misal: supplier, no invoice)"
                />
              </div>

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
            <Truck className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada pembelian bulan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Tanggal</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Bahan Baku</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Jumlah</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Harga Total</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Keterangan</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm">{formatDate(item.tanggal)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{item.bahan_baku?.nama || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span>{item.jumlah_kemasan} {item.bahan_baku?.satuan_beli || "kemasan"}</span>
                      <p className="text-xs text-white/40">
                        ({item.jumlah_satuan} {item.bahan_baku?.satuan || "unit"})
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-400">
                      {formatRupiah(item.harga_total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {item.keterangan || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item)}
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
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-foreground text-right">
                    TOTAL
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-emerald-400">
                    {formatRupiah(totalPembelian)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
