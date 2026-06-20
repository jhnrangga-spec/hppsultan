import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BahanBaku = {
  id: string;
  nama: string;
  deskripsi: string;
  satuan: string;
  harga_per_satuan: number;
  stok: number;
  stok_minimum: number;
  satuan_beli: string;
  harga_beli: number;
  isi_per_kemasan: number;
  berat_per_isi: number;
  created_at: string;
};

export type Produk = {
  id: string;
  nama: string;
  deskripsi: string;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
  created_at: string;
};

export type ResepItem = {
  id: string;
  produk_id: string;
  bahan_baku_id: string;
  jumlah: number;
  bahan_baku?: BahanBaku;
};

export type Produksi = {
  id: string;
  produk_id: string;
  jumlah_produksi: number;
  biaya_tenaga_kerja: number;
  biaya_overhead: number;
  total_biaya_bahan: number;
  total_hpp: number;
  hpp_per_unit: number;
  tanggal: string;
  created_at: string;
  produk?: Produk;
};

export type Aset = {
  id: string;
  nama: string;
  kategori: string;
  jumlah: number;
  harga_satuan: number;
  total_harga: number;
  umur_ekonomis: number;
  tanggal_beli: string;
  keterangan: string;
  created_at: string;
};

export type Pengeluaran = {
  id: string;
  nama: string;
  kategori: string;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  created_at: string;
};

export type Pembelian = {
  id: string;
  bahan_baku_id: string;
  jumlah_kemasan: number;
  jumlah_satuan: number;
  harga_total: number;
  tanggal: string;
  keterangan: string;
  created_at: string;
  bahan_baku?: BahanBaku;
};

export type MutasiStok = {
  id: string;
  tipe: "bahan_baku" | "produk";
  item_id: string;
  item_nama: string;
  jenis: "masuk" | "keluar";
  jumlah: number;
  satuan: string;
  saldo_akhir: number;
  referensi: string;
  tanggal: string;
  keterangan: string;
  created_at: string;
};

export type Penjualan = {
  id: string;
  produk_id: string;
  jumlah: number;
  harga_jual: number;
  total: number;
  tanggal: string;
  keterangan: string;
  created_at: string;
  produk?: Produk;
};
