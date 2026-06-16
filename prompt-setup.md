Saya punya aplikasi Next.js "HPP Kopi Brand Sultan" yang sudah jadi di GitHub repo: jhnrangga-spec/hppsultan (branch: claude/optimistic-franklin-kr9ykp).

Aplikasi ini menggunakan Supabase sebagai database dan akan di-deploy ke Vercel.

Tolong bantu saya step-by-step dengan screenshot guidance untuk:

---

## STEP 1: Setup Supabase

Bantu saya membuat project Supabase baru dan menjalankan SQL schema berikut di SQL Editor:

```sql
-- Tabel Bahan Baku
create table if not exists bahan_baku (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
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

-- Aktifkan Row Level Security
alter table bahan_baku enable row level security;
alter table produk enable row level security;
alter table resep enable row level security;
alter table produksi enable row level security;

-- Policy: allow all
create policy "Allow all on bahan_baku" on bahan_baku for all using (true) with check (true);
create policy "Allow all on produk" on produk for all using (true) with check (true);
create policy "Allow all on resep" on resep for all using (true) with check (true);
create policy "Allow all on produksi" on produksi for all using (true) with check (true);
```

Setelah SQL dijalankan, bantu saya menemukan Project URL dan anon key di Settings > API.

---

## STEP 2: Deploy ke Vercel

Bantu saya deploy repo GitHub `jhnrangga-spec/hppsultan` ke Vercel dengan langkah:

1. Import project dari GitHub
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Project URL dari Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon key dari Supabase)
3. Deploy

Tolong pandu saya satu per satu, tunggu konfirmasi saya sebelum lanjut ke step berikutnya. Gunakan bahasa Indonesia.
