-- ============================================================
-- KİTAP DÜKKANI STOK / SATIŞ / CİRO YÖNETİM SİSTEMİ
-- Supabase SQL Editor içinde SIRAYLA çalıştırın
-- ============================================================

-- 1) Gerekli eklenti
create extension if not exists "uuid-ossp";

-- 2) KİTAPLAR TABLOSU
create table if not exists public.books (
  id          uuid primary key default uuid_generate_v4(),
  barcode     text unique not null,
  name        text not null,
  author      text,
  category    text,
  price       numeric(10,2) not null default 0,
  stock       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.books is 'Kitap stok kayıtları (barkod bazlı benzersiz)';

-- 3) SATIŞ GEÇMİŞİ TABLOSU
create table if not exists public.sales_history (
  id         uuid primary key default uuid_generate_v4(),
  book_id    uuid references public.books(id) on delete set null,
  barcode    text not null,
  book_name  text not null,
  price      numeric(10,2) not null,
  sold_at    timestamptz not null default now()
);

comment on table public.sales_history is 'Her satış işleminin kalıcı kaydı (ciro hesaplaması bu tablodan yapılır)';

-- 4) İNDEKSLER (hızlı arama ve sıralama için)
create index if not exists idx_books_barcode      on public.books (barcode);
create index if not exists idx_books_name_trgm     on public.books using gin (name gin_trgm_ops);
create index if not exists idx_books_author_trgm   on public.books using gin (author gin_trgm_ops);
create index if not exists idx_sales_sold_at_desc  on public.sales_history (sold_at desc);
create index if not exists idx_sales_barcode       on public.sales_history (barcode);

-- gin_trgm_ops (isim/yazar için "içeren" arama) kullanmak için pg_trgm eklentisi gerekir
create extension if not exists pg_trgm;

-- 5) updated_at OTOMATİK GÜNCELLEME TRIGGER'I
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at
before update on public.books
for each row execute function public.set_updated_at();

-- 6) ATOMİK SATIŞ FONKSİYONU (race-condition'a karşı güvenli!)
-- Aynı kitabı iki cihazdan aynı anda satmaya çalışsalar bile stok yanlış düşmez,
-- çünkü UPDATE + INSERT tek bir transaction içinde ve satır kilidiyle yapılır.
create or replace function public.sell_book(p_barcode text)
returns table (
  id        uuid,
  barcode   text,
  name      text,
  author    text,
  category  text,
  price     numeric,
  stock     integer
) as $$
declare
  v_book public.books%rowtype;
begin
  update public.books
     set stock = stock - 1
   where barcode = p_barcode
     and stock > 0
  returning * into v_book;

  if v_book.id is null then
    -- Kitap yok veya stok 0
    raise exception 'STOK_YETERSIZ_VEYA_KITAP_YOK' using errcode = 'P0001';
  end if;

  insert into public.sales_history (book_id, barcode, book_name, price)
  values (v_book.id, v_book.barcode, v_book.name, v_book.price);

  return query
    select v_book.id, v_book.barcode, v_book.name, v_book.author,
           v_book.category, v_book.price, v_book.stock;
end;
$$ language plpgsql security definer;

-- 7) REALTIME YAYINI AKTİF ET (çoklu cihaz anlık senkronizasyon)
alter publication supabase_realtime add table public.books;
alter publication supabase_realtime add table public.sales_history;

-- 8) ROW LEVEL SECURITY
-- Not: Bu, dükkan içi kapalı bir kullanım (kasa + telefon) için basitleştirilmiş,
-- herkese (anon key ile) okuma/yazma izni veren bir politikadır. Uygulamayı internete
-- açık bırakacaksanız ileride Supabase Auth ekleyip politikaları sıkılaştırmanız önerilir.
alter table public.books enable row level security;
alter table public.sales_history enable row level security;

drop policy if exists "books_allow_all" on public.books;
create policy "books_allow_all" on public.books
  for all using (true) with check (true);

drop policy if exists "sales_allow_all" on public.sales_history;
create policy "sales_allow_all" on public.sales_history
  for all using (true) with check (true);

-- ============================================================
-- BİTTİ. Artık "Table Editor" veya "SQL Editor > Run" ile
-- tabloları görebilir, RPC fonksiyonunu Database > Functions
-- altında kontrol edebilirsiniz.
-- ============================================================
