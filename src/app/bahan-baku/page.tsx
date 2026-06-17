"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import type { BahanBaku } from "@/lib/supabase";
import { Package, Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";

export default function BahanBakuPage() {
  const [items, setItems] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BahanBaku | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    deskripsi: "",
    satuan: "kg",
    harga_per_satuan: "",
    stok: "",
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("bahan_baku")
      .select("*")
      .order("nama");
    if (err) {
      setError("Gagal memuat data: " + err.message);
      setItems([]);
    } else {
      setItems((data as BahanBaku[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openAdd() {
    setEditItem(null);
    setForm({ nama: "", deskripsi: "", satuan: "kg", harga_per_satuan: "", stok: "" });
    setShowForm(true);
    setError(null);
  }

  function openEdit(item: BahanBaku) {
    setEditItem(item);
    setForm({
      nama: item.nama,
      deskripsi: item.deskripsi || "",
      satuan: item.satuan,
      harga_per_satuan: item.harga_per_satuan.toString(),
      stok: item.stok.toString(),
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
      deskripsi: form.deskripsi,
      satuan: form.satuan,
      harga_per_satuan: parseFloat(form.harga_per_satuan),
      stok: parseFloat(form.stok),
    };

    let err;
    if (editItem) {
      ({ error: err } = await supabase
        .from("bahan_baku")
        .update(payload)
        .eq("id", editItem.id));
    } else {
      ({ error: err } = await supabase.from("bahan_baku").insert(payload));
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
    if (!confirm("Yakin ingin menghapus bahan baku ini?")) return;
    const { error: err } = await supabase
      .from("bahan_baku")
      .delete()
      .eq("id", id);
    if (err) {
      setError("Gagal menghapus: " + err.message);
      return;
    }
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">Bahan Baku</h1>
            <p className="text-brand/60">Kelola bahan baku kopi Anda</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Bahan
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark">
                {editItem ? "Edit" : "Tambah"} Bahan Baku
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
                  Nama Bahan
                </label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Contoh: Biji Kopi Arabica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  rows={2}
                  placeholder="Keterangan bahan baku (opsional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Satuan
                  </label>
                  <select
                    value={form.satuan}
                    onChange={(e) =>
                      setForm({ ...form, satuan: e.target.value })
                    }
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Stok
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: e.target.value })}
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Harga per Satuan (Rp)
                </label>
                <input
                  type="number"
                  required
                  step="1"
                  value={form.harga_per_satuan}
                  onChange={(e) =>
                    setForm({ ...form, harga_per_satuan: e.target.value })
                  }
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="0"
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
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada bahan baku.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-dark/5">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Nama
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-brand/70">
                    Satuan
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Harga/Satuan
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Stok
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Nilai Stok
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-brand/5">
                    <td className="px-6 py-4">
                      <span className="font-medium">{item.nama}</span>
                      {item.deskripsi && (
                        <p className="text-xs text-brand/40 mt-0.5">
                          {item.deskripsi}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand/60">
                      {item.satuan}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatRupiah(item.harga_per_satuan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {item.stok} {item.satuan}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-brand">
                      {formatRupiah(item.harga_per_satuan * item.stok)}
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
                    colSpan={3}
                    className="px-6 py-3 text-sm font-semibold text-brand-dark text-right"
                  >
                    TOTAL NILAI STOK
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-brand-dark">
                    {items.length} item
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-brand">
                    {formatRupiah(
                      items.reduce(
                        (sum, item) => sum + item.harga_per_satuan * item.stok,
                        0
                      )
                    )}
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
