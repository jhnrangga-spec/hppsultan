-- ============================================
-- Schema Database HPP Kopi Sultan
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- Tabel Bahan Baku
create table if not exists bahan_baku (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  deskripsi text default '',
  satuan text not null default 'kg',
  harga_per_satuan numeric not null default 0,
  stok numeric not null default 0,
  created_at timestamp with time zone default now()
);

-- Tabel Produk
create table if not exists produk (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  deskripsi text default '',
  harga_jual numeric not null default 0,
  created_at timestamp with time zone default now()
);

-- Tabel Resep (bahan baku per produk)
create table if not exists resep (
  id uuid default gen_random_uuid() primary key,
  produk_id uuid not null references produk(id) on delete cascade,
  bahan_baku_id uuid not null references bahan_baku(id) on delete cascade,
  jumlah numeric not null default 0,
  created_at timestamp with time zone default now()
);

-- Tabel Produksi (riwayat HPP)
create table if not exists produksi (
  id uuid default gen_random_uuid() primary key,
  produk_id uuid not null references produk(id) on delete cascade,
  jumlah_produksi integer not null default 0,
  biaya_tenaga_kerja numeric not null default 0,
  biaya_overhead numeric not null default 0,
  total_biaya_bahan numeric not null default 0,
  total_hpp numeric not null default 0,
  hpp_per_unit numeric not null default 0,
  tanggal date not null default current_date,
  created_at timestamp with time zone default now()
);

-- Tabel Aset Modal Awal
create table if not exists aset (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  kategori text not null default 'Peralatan',
  jumlah integer not null default 1,
  harga_satuan numeric not null default 0,
  total_harga numeric not null default 0,
  umur_ekonomis integer not null default 5,
  tanggal_beli date not null default current_date,
  keterangan text default '',
  created_at timestamp with time zone default now()
);

-- Aktifkan Row Level Security
alter table bahan_baku enable row level security;
alter table produk enable row level security;
alter table resep enable row level security;
alter table produksi enable row level security;
alter table aset enable row level security;

-- Policy: allow all untuk anonymous/authenticated (sesuaikan untuk production)
create policy "Allow all on bahan_baku" on bahan_baku for all using (true) with check (true);
create policy "Allow all on produk" on produk for all using (true) with check (true);
create policy "Allow all on resep" on resep for all using (true) with check (true);
create policy "Allow all on produksi" on produksi for all using (true) with check (true);
create policy "Allow all on aset" on aset for all using (true) with check (true);
