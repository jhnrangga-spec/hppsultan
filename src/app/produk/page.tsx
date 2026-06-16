"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import type { Produk, BahanBaku, ResepItem } from "@/lib/supabase";
import { Coffee, Plus, Pencil, Trash2, X, ChefHat } from "lucide-react";

export default function ProdukPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [bahanList, setBahanList] = useState<BahanBaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showResep, setShowResep] = useState<string | null>(null);
  const [resepItems, setResepItems] = useState<ResepItem[]>([]);
  const [editItem, setEditItem] = useState<Produk | null>(null);
  const [form, setForm] = useState({
    nama: "",
    deskripsi: "",
    harga_jual: "",
  });
  const [resepForm, setResepForm] = useState({
    bahan_baku_id: "",
    jumlah: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [produkRes, bahanRes] = await Promise.all([
      supabase.from("produk").select("*").order("nama"),
      supabase.from("bahan_baku").select("*").order("nama"),
    ]);
    setProdukList((produkRes.data as Produk[]) || []);
    setBahanList((bahanRes.data as BahanBaku[]) || []);
    setLoading(false);
  }

  async function loadResep(produkId: string) {
    const { data } = await supabase
      .from("resep")
      .select("*, bahan_baku(*)")
      .eq("produk_id", produkId);
    setResepItems((data as ResepItem[]) || []);
    setShowResep(produkId);
  }

  function openAdd() {
    setEditItem(null);
    setForm({ nama: "", deskripsi: "", harga_jual: "" });
    setShowForm(true);
  }

  function openEdit(item: Produk) {
    setEditItem(item);
    setForm({
      nama: item.nama,
      deskripsi: item.deskripsi || "",
      harga_jual: item.harga_jual.toString(),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      nama: form.nama,
      deskripsi: form.deskripsi,
      harga_jual: parseFloat(form.harga_jual),
    };

    if (editItem) {
      await supabase.from("produk").update(payload).eq("id", editItem.id);
    } else {
      await supabase.from("produk").insert(payload);
    }

    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    await supabase.from("produk").delete().eq("id", id);
    loadData();
  }

  async function addResepItem(e: React.FormEvent) {
    e.preventDefault();
    if (!showResep) return;
    await supabase.from("resep").insert({
      produk_id: showResep,
      bahan_baku_id: resepForm.bahan_baku_id,
      jumlah: parseFloat(resepForm.jumlah),
    });
    setResepForm({ bahan_baku_id: "", jumlah: "" });
    loadResep(showResep);
  }

  async function removeResepItem(id: string) {
    if (!showResep) return;
    await supabase.from("resep").delete().eq("id", id);
    loadResep(showResep);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Coffee className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">Produk</h1>
            <p className="text-brand/60">Kelola produk kopi dan resepnya</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark">
                {editItem ? "Edit" : "Tambah"} Produk
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
                  Nama Produk
                </label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Contoh: Kopi Sultan Arabica 200g"
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
                  rows={3}
                  placeholder="Deskripsi produk..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  required
                  step="1"
                  value={form.harga_jual}
                  onChange={(e) =>
                    setForm({ ...form, harga_jual: e.target.value })
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
                  className="flex-1 bg-gold text-brand-dark font-semibold px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
                >
                  {editItem ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-gold" />
                Resep Produk
              </h2>
              <button
                onClick={() => setShowResep(null)}
                className="text-brand/40 hover:text-brand"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={addResepItem}
              className="flex gap-3 mb-4"
            >
              <select
                required
                value={resepForm.bahan_baku_id}
                onChange={(e) =>
                  setResepForm({ ...resepForm, bahan_baku_id: e.target.value })
                }
                className="flex-1 border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
              >
                <option value="">Pilih bahan...</option>
                {bahanList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama} ({b.satuan})
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                step="0.01"
                value={resepForm.jumlah}
                onChange={(e) =>
                  setResepForm({ ...resepForm, jumlah: e.target.value })
                }
                className="w-24 border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                placeholder="Jumlah"
              />
              <button
                type="submit"
                className="bg-gold text-brand-dark font-semibold px-4 py-2 rounded-lg hover:bg-gold-light transition-colors text-sm"
              >
                Tambah
              </button>
            </form>

            {resepItems.length === 0 ? (
              <p className="text-center text-brand/40 py-6">
                Belum ada bahan dalam resep.
              </p>
            ) : (
              <div className="space-y-2">
                {resepItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-cream rounded-lg px-4 py-3"
                  >
                    <div>
                      <span className="font-medium">
                        {item.bahan_baku?.nama}
                      </span>
                      <span className="text-sm text-brand/50 ml-2">
                        {item.jumlah} {item.bahan_baku?.satuan}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-brand">
                        {formatRupiah(
                          item.jumlah *
                            (item.bahan_baku?.harga_per_satuan || 0)
                        )}
                      </span>
                      <button
                        onClick={() => removeResepItem(item.id)}
                        className="text-red-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right pt-2 font-semibold text-brand-dark">
                  Total Bahan:{" "}
                  {formatRupiah(
                    resepItems.reduce(
                      (sum, i) =>
                        sum +
                        i.jumlah * (i.bahan_baku?.harga_per_satuan || 0),
                      0
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-brand/10">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : produkList.length === 0 ? (
          <div className="p-12 text-center text-brand/40">
            <Coffee className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Belum ada produk.</p>
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
                    Deskripsi
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Harga Jual
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {produkList.map((item) => (
                  <tr key={item.id} className="hover:bg-brand/5">
                    <td className="px-6 py-4 font-medium">{item.nama}</td>
                    <td className="px-6 py-4 text-sm text-brand/60">
                      {item.deskripsi || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatRupiah(item.harga_jual)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => loadResep(item.id)}
                          className="p-2 text-gold hover:text-gold-light rounded-lg hover:bg-gold/10"
                          title="Kelola Resep"
                        >
                          <ChefHat className="w-4 h-4" />
                        </button>
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
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
