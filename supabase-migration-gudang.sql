-- ============================================
-- Migration: Fitur Gudang (Stok, Pembelian, Mutasi)
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- Tambah kolom stok & stok_minimum ke produk
ALTER TABLE produk ADD COLUMN IF NOT EXISTS stok integer NOT NULL DEFAULT 0;
ALTER TABLE produk ADD COLUMN IF NOT EXISTS stok_minimum integer NOT NULL DEFAULT 0;

-- Tambah kolom stok_minimum ke bahan_baku
ALTER TABLE bahan_baku ADD COLUMN IF NOT EXISTS stok_minimum numeric NOT NULL DEFAULT 0;

-- Tabel Pembelian Bahan Baku
CREATE TABLE IF NOT EXISTS pembelian (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bahan_baku_id uuid NOT NULL REFERENCES bahan_baku(id) ON DELETE CASCADE,
  jumlah_kemasan numeric NOT NULL DEFAULT 0,
  jumlah_satuan numeric NOT NULL DEFAULT 0,
  harga_total numeric NOT NULL DEFAULT 0,
  tanggal date NOT NULL DEFAULT current_date,
  keterangan text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

-- Tabel Mutasi Stok (Kartu Stok)
CREATE TABLE IF NOT EXISTS mutasi_stok (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipe text NOT NULL DEFAULT 'bahan_baku',
  item_id uuid NOT NULL,
  item_nama text NOT NULL DEFAULT '',
  jenis text NOT NULL DEFAULT 'masuk',
  jumlah numeric NOT NULL DEFAULT 0,
  satuan text NOT NULL DEFAULT '',
  saldo_akhir numeric NOT NULL DEFAULT 0,
  referensi text DEFAULT '',
  tanggal date NOT NULL DEFAULT current_date,
  keterangan text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

-- Aktifkan RLS
ALTER TABLE pembelian ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_stok ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Allow all on pembelian" ON pembelian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mutasi_stok" ON mutasi_stok FOR ALL USING (true) WITH CHECK (true);
