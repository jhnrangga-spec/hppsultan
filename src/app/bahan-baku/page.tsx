"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import type { BahanBaku } from "@/lib/supabase";
import { Package, Plus, Pencil, Trash2, X, AlertCircle, ArrowRight } from "lucide-react";

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
    satuan_beli: "pack",
    harga_beli: "",
    isi_per_kemasan: "",
    berat_per_isi: "",
    satuan: "g",
    stok_kemasan: "",
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

  const hargaBeli = parseFloat(form.harga_beli) || 0;
  const isiKemasan = parseFloat(form.isi_per_kemasan) || 1;
  const beratPerIsi = parseFloat(form.berat_per_isi) || 0;
  const stokKemasan = parseFloat(form.stok_kemasan) || 0;

  const totalPerKemasan = beratPerIsi > 0 ? isiKemasan * beratPerIsi : isiKemasan;
  const satuanResep = beratPerIsi > 0 ? form.satuan : "pcs";
  const hargaPerSatuan = totalPerKemasan > 0 ? hargaBeli / totalPerKemasan : 0;
  const stokResep = stokKemasan * totalPerKemasan;

  function openAdd() {
    setEditItem(null);
    setForm({
      nama: "",
      deskripsi: "",
      satuan_beli: "pack",
      harga_beli: "",
      isi_per_kemasan: "",
      berat_per_isi: "",
      satuan: "g",
      stok_kemasan: "",
    });
    setShowForm(true);
    setError(null);
  }

  function openEdit(item: BahanBaku) {
    setEditItem(item);
    const isi = item.isi_per_kemasan || 1;
    const berat = item.berat_per_isi || 0;
    const perKemasan = berat > 0 ? isi * berat : isi;
    const kemasan = perKemasan > 0 ? item.stok / perKemasan : item.stok;
    setForm({
      nama: item.nama,
      deskripsi: item.deskripsi || "",
      satuan_beli: item.satuan_beli || "pack",
      harga_beli: (item.harga_beli || 0).toString(),
      isi_per_kemasan: isi.toString(),
      berat_per_isi: berat > 0 ? berat.toString() : "",
      satuan: item.satuan || "g",
      stok_kemasan: kemasan.toString(),
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
      satuan_beli: form.satuan_beli,
      harga_beli: hargaBeli,
      isi_per_kemasan: isiKemasan,
      berat_per_isi: beratPerIsi,
      satuan: satuanResep,
      harga_per_satuan: hargaPerSatuan,
      stok: stokResep,
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

  function getItemCalc(item: BahanBaku) {
    const isi = item.isi_per_kemasan || 1;
    const berat = item.berat_per_isi || 0;
    const perKemasan = berat > 0 ? isi * berat : isi;
    const jumlahKemasan = perKemasan > 0 ? item.stok / perKemasan : 0;
    const hargaKemasan = item.harga_beli || 0;
    const totalBeli = hargaKemasan * jumlahKemasan;
    return { isi, berat, perKemasan, jumlahKemasan, hargaKemasan, totalBeli };
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
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
                  placeholder="Contoh: KKP, Susu UHT, Gula"
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

              <div className="border border-brand/10 rounded-lg p-4 bg-cream/50 space-y-4">
                <h3 className="text-sm font-semibold text-brand-dark">
                  Informasi Pembelian & Konversi
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand/70 mb-1">
                      Satuan Beli
                    </label>
                    <select
                      value={form.satuan_beli}
                      onChange={(e) =>
                        setForm({ ...form, satuan_beli: e.target.value })
                      }
                      className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                    >
                      <option value="pack">Pack</option>
                      <option value="karton">Karton</option>
                      <option value="dus">Dus</option>
                      <option value="bag">Bag</option>
                      <option value="kg">Kg</option>
                      <option value="liter">Liter</option>
                      <option value="pcs">Pcs (satuan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/70 mb-1">
                      Harga Beli / {form.satuan_beli}
                    </label>
                    <input
                      type="number"
                      required
                      step="1"
                      value={form.harga_beli}
                      onChange={(e) =>
                        setForm({ ...form, harga_beli: e.target.value })
                      }
                      className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                      placeholder="Rp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand/70 mb-1">
                      Isi per {form.satuan_beli} (pcs)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={form.isi_per_kemasan}
                      onChange={(e) =>
                        setForm({ ...form, isi_per_kemasan: e.target.value })
                      }
                      className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                      placeholder="Contoh: 24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/70 mb-1">
                      Berat / pcs
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={form.berat_per_isi}
                        onChange={(e) =>
                          setForm({ ...form, berat_per_isi: e.target.value })
                        }
                        className="flex-1 border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                        placeholder="Contoh: 90"
                      />
                      <select
                        value={form.satuan}
                        onChange={(e) =>
                          setForm({ ...form, satuan: e.target.value })
                        }
                        className="w-20 border border-brand/20 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="kg">kg</option>
                        <option value="liter">ltr</option>
                      </select>
                    </div>
                    <p className="text-xs text-brand/40 mt-1">
                      Kosongkan jika satuan resep = pcs
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand/70 mb-1">
                    Stok (jumlah {form.satuan_beli})
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={form.stok_kemasan}
                    onChange={(e) => setForm({ ...form, stok_kemasan: e.target.value })}
                    className="w-full border border-brand/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Contoh: 6"
                  />
                </div>

                {hargaBeli > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-brand/10 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-brand/50">1 {form.satuan_beli}</span>
                      <ArrowRight className="w-3 h-3 text-brand/30" />
                      <span className="font-medium">{isiKemasan} pcs</span>
                      {beratPerIsi > 0 && (
                        <>
                          <ArrowRight className="w-3 h-3 text-brand/30" />
                          <span className="font-medium">
                            {totalPerKemasan} {form.satuan}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand/60">
                        Harga per {satuanResep} (untuk resep):
                      </span>
                      <span className="font-bold text-lg text-gold">
                        {formatRupiah(hargaPerSatuan)}
                      </span>
                    </div>
                    {beratPerIsi > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-brand/60">Harga per pcs:</span>
                        <span className="font-medium text-sm text-brand">
                          {formatRupiah(hargaBeli / isiKemasan)}
                        </span>
                      </div>
                    )}
                    {stokKemasan > 0 && (
                      <>
                        <div className="border-t border-brand/10 pt-2 flex items-center justify-between">
                          <span className="text-sm text-brand/60">
                            Stok total:
                          </span>
                          <span className="font-medium text-sm">
                            {stokKemasan} {form.satuan_beli} = {stokResep} {satuanResep}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-brand/60">Total pembelian:</span>
                          <span className="font-bold text-brand">
                            {formatRupiah(hargaBeli * stokKemasan)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                    Kemasan
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Harga/Kemasan
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Harga/Satuan Resep
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Stok
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Total Pembelian
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-brand/70">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand/5">
                {items.map((item) => {
                  const c = getItemCalc(item);
                  const kemasanLabel = c.berat > 0
                    ? `1 ${item.satuan_beli || "pack"} = ${c.isi} pcs × ${c.berat}${item.satuan}`
                    : `1 ${item.satuan_beli || "pack"} = ${c.isi} pcs`;
                  return (
                    <tr key={item.id} className="hover:bg-brand/5">
                      <td className="px-6 py-4">
                        <span className="font-medium">{item.nama}</span>
                        {item.deskripsi && (
                          <p className="text-xs text-brand/40 mt-0.5">
                            {item.deskripsi}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand/60">
                        {kemasanLabel}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {formatRupiah(c.hargaKemasan)}/{item.satuan_beli || "pack"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gold">
                        {formatRupiah(item.harga_per_satuan)}/{item.satuan}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span>{Math.round(c.jumlahKemasan)} {item.satuan_beli || "pack"}</span>
                        <p className="text-xs text-brand/40">{item.stok} {item.satuan}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-brand">
                        {formatRupiah(c.totalBeli)}
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
                  );
                })}
              </tbody>
              <tfoot className="bg-brand-dark/5">
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-3 text-sm font-semibold text-brand-dark text-right"
                  >
                    TOTAL PEMBELIAN
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-brand-dark">
                    {items.length} item
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right text-brand">
                    {formatRupiah(
                      items.reduce((sum, item) => sum + getItemCalc(item).totalBeli, 0)
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
