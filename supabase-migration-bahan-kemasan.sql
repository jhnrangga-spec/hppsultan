-- Migration: Tambah kolom kemasan ke bahan_baku
-- Jalankan di Supabase SQL Editor

alter table bahan_baku add column if not exists satuan_beli text default 'pack';
alter table bahan_baku add column if not exists harga_beli numeric default 0;
alter table bahan_baku add column if not exists isi_per_kemasan numeric default 1;
alter table bahan_baku add column if not exists berat_per_isi numeric default 0;
