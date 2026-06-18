"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { Pengeluaran } from "@/lib/supabase";
import { Wallet, Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";

const KATEGORI_OPTIONS = [
  "Listrik",
  "Sewa Tempat",
  "Air / PDAM",
  "Gas / Bahan Bakar",
  "Internet / WiFi",
  "Gaji Karyawan",
  "Transportasi",
  "Perawatan Mesin",
  "Kebersihan",
  "Kemasan / Packaging",
  "Marketing / Iklan",
  "Lain-lain",
];

export default function PengeluaranPage() {
  const [items, setItems] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Pengeluaran | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterBulan, setFilterBulan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [form, setForm] = useState({
    nama: "",
    kategori: "Listrik",
    jumlah: "",
    tanggal: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    const startDate = `${filterBulan}-01`;
    const endParts = filterBulan.split("-");
    const endYear = parseInt(endParts[0]);
    const endMonth = parseInt(endParts[1]);
    const lastDay = new Date(endYear, endMonth, 0).getDate();
    const endDate = `${filterBulan}-${lastDay}`;

    const { data, error: err } = await supabase
      .from("pengeluaran")
      .select("*")
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: false });
    if (err) {
      setError("Gagal memuat data: " + err.message);
      setItems([]);
    } else {
      setItems((data as Pengeluaran[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [filterBulan]);

  function openAdd() {
    setEditItem(null);
    setForm({
      nama: "",
      kategori: "Listrik",
      jumlah: "",
      tanggal: new Date().toISOString().split("T")[0],
      keterangan: "",
    });
    setShowForm(true);
    setError(null);
  }

  function openEdit(item: Pengeluaran) {
    setEditItem(item);
    setForm({
      nama: item.nama,
      kategori: item.kategori,
      jumlah: item.jumlah.toString(),
      tanggal: item.tanggal,
      keterangan: item.keterangan || "",
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      nama: form.nama,
      kategori: form.kategori,
      jumlah: parseFloat(form.jumlah),
      tanggal: form.tanggal,
      keterangan: form.keterangan,
    };

    let err;
    if (editItem) {
      ({ error: err } = await supabase
        .from("pengeluaran")
        .update(payload)
        .eq("id", editItem.id));
    } else {
      ({ error: err } = await supabase.from("pengeluaran").insert(payload));
    }

    setSubmitting(false);

    if (err) {
      setError("Gagal menyimpan: " + err.message);
      return;
    }

    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus pengeluaran ini?")) return;
    const { error: err } = await supabase
      .from("pengeluaran")
      .delete()
      .eq("id", id);
    if (err) {
      setError("Gagal menghapus: " + err.message);
      return;
    }
    loadData();
  }

  const totalBulan = items.reduce((s, p) => s + p.jumlah, 0);

  const perKategori = KATEGORI_OPTIONS.map((kat) => {
    const total = items
      .filter((i) => i.kategori === kat)
      .reduce((s, i) => s + i.jumlah, 0);
    return { kategori: kat, total };
  }).filter((k) => k.total > 0);

  const bulanLabel = new Date(filterBulan + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pengeluaran</h1>
            <p className="text-white/60">Catat pengeluaran operasional bulanan</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah
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
          <p className="text-sm text-white/50">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-brand">{formatRupiah(totalBulan)}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Jumlah Transaksi</p>
          <p className="text-2xl font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
        <div className="bg-cream rounded-xl p-5 shadow-sm border border-white/10">
          <p className="text-sm text-white/50">Rata-rata / Transaksi</p>
          <p className="text-2xl font-bold text-gold">
            {items.length > 0 ? formatRupiah(totalBulan / items.length) : "Rp 0"}
          </p>
          <p className="text-xs text-white/40 mt-1">{bulanLabel}</p>
        </div>
      </div>

      {perKategori.length > 0 && (
        <div className="bg-cream rounded-xl shadow-sm border border-white/10 p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Ringkasan per Kategori</h3>
          <div className="space-y-2">
            {perKategori.sort((a, b) => b.total - a.total).map((k) => (
              <div key={k.kategori} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm text-white/70">{k.kategori}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${Math.min((k.total / totalBulan) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground ml-4 min-w-[120px] text-right">
                  {formatRupiah(k.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cream rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {editItem ? "Edit" : "Tambah"} Pengeluaran
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Nama Pengeluaran</label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Contoh: Bayar Listrik Juni"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    {KATEGORI_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  required
                  step="1"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Keterangan</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  rows={2}
                  placeholder="Opsional"
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
                  {submitting ? "Menyimpan..." : editItem ? "Simpan" : "Tambah"}
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
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada pengeluaran bulan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Tanggal</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Nama</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-white/70">Kategori</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Jumlah</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-white/70">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-sm">{formatDate(item.tanggal)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{item.nama}</span>
                      {item.keterangan && (
                        <p className="text-xs text-white/40 mt-0.5">{item.keterangan}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-brand/20 text-brand px-2 py-1 rounded-full">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-brand">
                      {formatRupiah(item.jumlah)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-foreground text-right">
                    TOTAL BULAN INI
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-brand">
                    {formatRupiah(totalBulan)}
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
