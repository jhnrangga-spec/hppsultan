-- ============================================
-- Migrasi: Tambah Tabel Aset Modal Awal
-- Jalankan SQL ini di Supabase SQL Editor
-- (untuk database yang sudah ada)
-- ============================================

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

alter table aset enable row level security;
create policy "Allow all on aset" on aset for all using (true) with check (true);
