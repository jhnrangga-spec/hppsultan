-- Migration: Tambah tabel pengeluaran
-- Jalankan di Supabase SQL Editor

create table if not exists pengeluaran (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  kategori text not null default 'Lain-lain',
  jumlah numeric not null default 0,
  tanggal date not null default current_date,
  keterangan text default '',
  created_at timestamp with time zone default now()
);

alter table pengeluaran enable row level security;
create policy "Allow all on pengeluaran" on pengeluaran for all using (true) with check (true);
