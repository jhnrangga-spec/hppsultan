-- Migrasi: Tambah kolom deskripsi di tabel bahan_baku
-- Jalankan di Supabase SQL Editor jika tabel sudah ada

alter table bahan_baku add column if not exists deskripsi text default '';
