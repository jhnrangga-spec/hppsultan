"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import type { Produk, ResepItem } from "@/lib/supabase";
import { Calculator, Save, CheckCircle, AlertCircle, X } from "lucide-react";

export default function KalkulatorPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [selectedProduk, setSelectedProduk] = useState<string>("");
  const [resepItems, setResepItems] = useState<ResepItem[]>([]);
  const [jumlahProduksi, setJumlahProduksi] = useState("");
  const [biayaTenagaKerja, setBiayaTenagaKerja] = useState("");
  const [biayaOverhead, setBiayaOverhead] = useState("");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProduk() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("produk")
      .select("*")
      .order("nama");
    if (err) {
      setError("Gagal memuat produk: " + err.message);
    }
    setProdukList((data as Produk[]) || []);
    setLoading(false);
  }

  async function loadResep(produkId: string) {
    const { data, error: err } = await supabase
      .from("resep")
      .select("*, bahan_baku(*)")
      .eq("produk_id", produkId);
    if (err) {
      setError("Gagal memuat resep: " + err.message);
      return;
    }
    setResepItems((data as ResepItem[]) || []);
  }

  useEffect(() => {
    loadProduk();
  }, []);

  useEffect(() => {
    if (selectedProduk) {
      loadResep(selectedProduk);
    } else {
      setResepItems([]);
    }
  }, [selectedProduk]);

  const qty = parseFloat(jumlahProduksi) || 0;
  const tenagaKerja = parseFloat(biayaTenagaKerja) || 0;
  const overhead = parseFloat(biayaOverhead) || 0;

  const totalBiayaBahan = resepItems.reduce(
    (sum, item) =>
      sum + item.jumlah * (item.bahan_baku?.harga_per_satuan || 0) * qty,
    0
  );
  const totalHPP = totalBiayaBahan + tenagaKerja + overhead;
  const hppPerUnit = qty > 0 ? totalHPP / qty : 0;

  const currentProduk = produkList.find((p) => p.id === selectedProduk);
  const margin = currentProduk ? currentProduk.harga_jual - hppPerUnit : 0;
  const marginPersen =
    currentProduk && currentProduk.harga_jual > 0
      ? (margin / currentProduk.harga_jual) * 100
      : 0;

  async function handleSave() {
    if (!selectedProduk || qty <= 0) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("produksi").insert({
      produk_id: selectedProduk,
      jumlah_produksi: qty,
      biaya_tenaga_kerja: tenagaKerja,
      biaya_overhead: overhead,
      total_biaya_bahan: totalBiayaBahan,
      total_hpp: totalHPP,
      hpp_per_unit: hppPerUnit,
      tanggal,
    });

    setSaving(false);

    if (err) {
      setError("Gagal menyimpan produksi: " + err.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Calculator className="w-8 h-8 text-gold" />
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">
            Kalkulator HPP
          </h1>
          <p className="text-brand/60">
            Hitung Harga Pokok Produksi per unit
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-brand/10">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Informasi Produksi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Produk
                </label>
                <select
                  value={selectedProduk}
                  onChange={(e) => setSelectedProduk(e.target.value)}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">Pilih produk...</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Tanggal Produksi
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Jumlah Produksi (unit)
                </label>
                <input
                  type="number"
                  min="1"
                  value={jumlahProduksi}
                  onChange={(e) => setJumlahProduksi(e.target.value)}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {selectedProduk && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-brand/10">
              <h2 className="text-lg font-semibold text-brand-dark mb-4">
                Biaya Bahan Baku (per Resep)
              </h2>
              {resepItems.length === 0 ? (
                <p className="text-brand/40 text-center py-4">
                  Belum ada resep untuk produk ini. Tambah resep di halaman
                  Produk.
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
                          {item.jumlah} {item.bahan_baku?.satuan} x{" "}
                          {formatRupiah(
                            item.bahan_baku?.harga_per_satuan || 0
                          )}
                        </span>
                      </div>
                      <span className="font-medium text-brand">
                        {formatRupiah(
                          item.jumlah *
                            (item.bahan_baku?.harga_per_satuan || 0)
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="text-right pt-2 text-sm text-brand/60">
                    Biaya bahan per unit:{" "}
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
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-brand/10">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Biaya Tambahan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Biaya Tenaga Kerja (Rp)
                </label>
                <input
                  type="number"
                  value={biayaTenagaKerja}
                  onChange={(e) => setBiayaTenagaKerja(e.target.value)}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand/70 mb-1">
                  Biaya Overhead (Rp)
                </label>
                <input
                  type="number"
                  value={biayaOverhead}
                  onChange={(e) => setBiayaOverhead(e.target.value)}
                  className="w-full border border-brand/20 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Listrik, gas, sewa, dll"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-brand/10 sticky top-8">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Ringkasan HPP
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand/60">Total Bahan Baku</span>
                <span className="font-medium">
                  {formatRupiah(totalBiayaBahan)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand/60">Tenaga Kerja</span>
                <span className="font-medium">
                  {formatRupiah(tenagaKerja)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand/60">Overhead</span>
                <span className="font-medium">{formatRupiah(overhead)}</span>
              </div>
              <hr className="border-brand/10" />
              <div className="flex justify-between">
                <span className="font-semibold text-brand-dark">Total HPP</span>
                <span className="font-bold text-lg text-brand">
                  {formatRupiah(totalHPP)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-brand-dark">
                  HPP per Unit
                </span>
                <span className="font-bold text-xl text-gold">
                  {formatRupiah(hppPerUnit)}
                </span>
              </div>

              {currentProduk && qty > 0 && (
                <>
                  <hr className="border-brand/10" />
                  <div className="flex justify-between text-sm">
                    <span className="text-brand/60">Harga Jual</span>
                    <span className="font-medium">
                      {formatRupiah(currentProduk.harga_jual)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand/60">Margin per Unit</span>
                    <span
                      className={`font-bold ${
                        margin >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatRupiah(margin)} ({marginPersen.toFixed(1)}%)
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!selectedProduk || qty <= 0 || saving}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-gold text-brand-dark font-semibold px-4 py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Tersimpan!
                </>
              ) : saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-dark" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Produksi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
