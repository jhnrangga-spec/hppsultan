-- ============================================
-- Migration: Tabel Penjualan
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

create table if not exists penjualan (
  id uuid default gen_random_uuid() primary key,
  produk_id uuid not null references produk(id) on delete cascade,
  jumlah integer not null default 0,
  harga_jual numeric not null default 0,
  total numeric not null default 0,
  tanggal date not null default current_date,
  keterangan text default '',
  created_at timestamp with time zone default now()
);

alter table penjualan enable row level security;

create policy "Allow all on penjualan" on penjualan for all using (true) with check (true);
