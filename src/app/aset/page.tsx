"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah, formatDate } from "@/lib/format";
import type { Aset } from "@/lib/supabase";
import {
  Landmark,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  TrendingDown,
  Wallet,
  BarChart3,
} from "lucide-react";

const KATEGORI_LIST = [
  "Mesin Roasting",
  "Mesin Grinder",
  "Mesin Packing",
  "Peralatan Produksi",
  "Peralatan Cupping",
  "Kendaraan",
  "Bangunan/Sewa",
  "Furniture",
  "Elektronik",
  "Lainnya",
];

export default function AsetPage() {
  const [items, setItems] = useState<Aset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Aset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    kategori: "Peralatan Produksi",
    jumlah: "1",
    harga_satuan: "",
    umur_ekonomis: "5",
    tanggal_beli: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("aset")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError("Gagal memuat data: " + err.message);
      setItems([]);
    } else {
      setItems((data as Aset[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAdd() {
    setEditItem(null);
    setForm({
      nama: "",
      kategori: "Peralatan Produksi",
      jumlah: "1",
      harga_satuan: "",
      umur_ekonomis: "5",
      tanggal_beli: new Date().toISOString().split("T")[0],
      keterangan: "",
    });
    setShowForm(true);
    setError(null);
  }

  function openEdit(item: Aset) {
    setEditItem(item);
    setForm({
      nama: item.nama,
      kategori: item.kategori,
      jumlah: item.jumlah.toString(),
      harga_satuan: item.harga_satuan.toString(),
      umur_ekonomis: item.umur_ekonomis.toString(),
      tanggal_beli: item.tanggal_beli,
      keterangan: item.keterangan || "",
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const jumlah = parseInt(form.jumlah);
    const hargaSatuan = parseFloat(form.harga_satuan);

    const payload = {
      nama: form.nama,
      kategori: form.kategori,
      jumlah,
      harga_satuan: hargaSatuan,
      total_harga: jumlah * hargaSatuan,
      umur_ekonomis: parseInt(form.umur_ekonomis),
      tanggal_beli: form.tanggal_beli,
      keterangan: form.keterangan,
    };

    let err;
    if (editItem) {
      ({ error: err } = await supabase
        .from("aset")
        .update(payload)
        .eq("id", editItem.id));
    } else {
      ({ error: err } = await supabase.from("aset").insert(payload));
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
    if (!confirm("Yakin ingin menghapus aset ini?")) return;
    const { error: err } = await supabase.from("aset").delete().eq("id", id);
    if (err) {
      setError("Gagal menghapus: " + err.message);
      return;
    }
    loadData();
  }

  const totalModal = items.reduce((s, a) => s + a.total_harga, 0);
  const totalItem = items.reduce((s, a) => s + a.jumlah, 0);

  const now = new Date();
  const totalPenyusutan = items.reduce((s, a) => {
    const beli = new Date(a.tanggal_beli);
    const tahunBerjalan = Math.max(
      0,
      (now.getTime() - beli.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    const penyusutanPerTahun = a.total_harga / a.umur_ekonomis;
    const akumulasi = Math.min(
      a.total_harga,
      penyusutanPerTahun * tahunBerjalan
    );
    return s + akumulasi;
  }, 0);

  const nilaiSekarang = totalModal - totalPenyusutan;
  const penyusutanPerBulan = items.reduce((s, a) => {
    return s + a.total_harga / a.umur_ekonomis / 12;
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Landmark className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">
              Aset Modal Awal
            </h1>
            <p className="text-brand/60">
              Kelola peralatan, mesin, dan investasi awal
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Aset
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-gold" />
              <p className="text-sm text-brand/50">Total Modal Awal</p>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {formatRupiah(totalModal)}
            </p>
            <p className="text-xs text-brand/40 mt-1">{totalItem} item aset</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm text-brand/50">Nilai Sekarang</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatRupiah(nilaiSekarang)}
            </p>
            <p className="text-xs text-brand/40 mt-1">
              Setelah penyusutan
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <p className="text-sm text-brand/50">Total Penyusutan</p>
            </div>
            <p className="text-2xl font-bold text-red-500">
              {formatRupiah(totalPenyusutan)}
            </p>
            <p className="text-xs text-brand/40 mt-1">Akumulasi s/d hari ini</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-brand/50">Penyusutan/Bulan</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {formatRupiah(penyusutanPerBulan)}
            </p>
            <p className="text-xs text-brand/40 mt-1">
              Beban overhead bulanan
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark">
                {editItem ? "Edit" : "Tambah"} Aset
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-brand/40 hover:text-brand"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Nama Aset
                </label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Contoh: Mesin Roasting 5kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Kategori
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) =>
                    setForm({ ...form, kategori: e.target.value })
                  }
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {KATEGORI_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.jumlah}
                    onChange={(e) =>
                      setForm({ ...form, jumlah: e.target.value })
                    }
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Harga per Unit (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    step="1"
                    value={form.harga_satuan}
                    onChange={(e) =>
                      setForm({ ...form, harga_satuan: e.target.value })
                    }
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="0"
                  />
                </div>
              </div>
              {form.jumlah && form.harga_satuan && (
                <div className="bg-cream rounded-lg px-4 py-3 text-sm">
                  <span className="text-brand/60">Total: </span>
                  <span className="font-bold text-brand">
                    {formatRupiah(
                      parseInt(form.jumlah) * parseFloat(form.harga_satuan)
                    )}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Umur Ekonomis (tahun)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.umur_ekonomis}
                    onChange={(e) =>
                      setForm({ ...form, umur_ekonomis: e.target.value })
                    }
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_beli}
                    onChange={(e) =>
                      setForm({ ...form, tanggal_beli: e.target.value })
                    }
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
              {form.harga_satuan && form.jumlah && form.umur_ekonomis && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <p className="text-amber-700">
                    <span className="font-medium">Penyusutan: </span>
                    {formatRupiah(
                      (parseInt(form.jumlah) * parseFloat(form.harga_satuan)) /
                        parseInt(form.umur_ekonomis) /
                        12
                    )}
                    /bulan (metode garis lurus)
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Keterangan
                </label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-brand/20 text-brand/70 px-4 py-2.5 rounded-lg hover:bg-brand/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gold text-brand-dark font-semibold px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : editItem ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
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
            <Landmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada data aset.</p>
            <p className="text-sm mt-1">
              Tambahkan peralatan dan mesin untuk menghitung modal awal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-dark/5">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Nama Aset
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Kategori
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Qty
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Harga Satuan
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Total
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-brand/70">
                    Umur
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Penyusutan/Bln
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Tgl Beli
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-brand/5">
                    <td className="px-6 py-4 font-medium">
                      {item.nama}
                      {item.keterangan && (
                        <p className="text-xs text-brand/40 mt-0.5">
                          {item.keterangan}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand/60">
                      {item.kategori}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {item.jumlah}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatRupiah(item.harga_satuan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold">
                      {formatRupiah(item.total_harga)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {item.umur_ekonomis} thn
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-amber-600">
                      {formatRupiah(item.total_harga / item.umur_ekonomis / 12)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(item.tanggal_beli)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 text-brand/40 hover:text-brand rounded-lg hover:bg-brand/5"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-brand-dark/5">
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-3 text-sm font-semibold text-brand-dark text-right"
                  >
                    TOTAL MODAL AWAL
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-brand text-right">
                    {formatRupiah(totalModal)}
                  </td>
                  <td />
                  <td className="px-6 py-3 text-sm font-bold text-amber-600 text-right">
                    {formatRupiah(penyusutanPerBulan)}
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
