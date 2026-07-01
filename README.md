# 📚 Kitap Dükkanı — Stok, Satış ve Ciro Yönetim Uygulaması

React (Vite) + Tailwind CSS + Supabase ile geliştirilmiş, gerçek zamanlı,
çoklu cihaz destekli barkodlu satış ve stok takip sistemi.

## Kurulum

```bash
npm install
cp .env.example .env   # içine kendi Supabase bilgilerinizi yazın
npm run dev
```

`supabase/schema.sql` dosyasını Supabase projenizin **SQL Editor**'ünde çalıştırmanız gerekir
(detaylar ana sohbet mesajında).

## Klasör Yapısı

```
kitap-stok-app/
├─ supabase/
│  └─ schema.sql          # Tablolar, indeksler, RPC fonksiyonu, realtime
├─ src/
│  ├─ lib/supabaseClient.js
│  ├─ hooks/useBarcodeScanner.js
│  ├─ components/
│  │  ├─ SalesTab.jsx     # Barkodla hızlı satış (ana ekran)
│  │  ├─ SearchTab.jsx    # Canlı arama
│  │  ├─ UploadTab.jsx    # Excel/CSV içe aktarma
│  │  └─ RevenueTab.jsx   # Ciro & satış geçmişi
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ .env.example
├─ package.json
└─ vite.config.js
```

## Vercel'e Deploy

1. Kodu bir GitHub reposuna push edin.
2. vercel.com üzerinden "Add New Project" ile repoyu içe aktarın (Framework: Vite otomatik algılanır).
3. Environment Variables kısmına `.env` dosyanızdaki iki değişkeni ekleyin:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy'a basın. Vercel size `https://proje-adiniz.vercel.app` gibi bir link verecek.
5. Bu linki hem bilgisayardan hem telefondan açtığınızda aynı veritabanına bağlanırsınız —
   gerçek zamanlı senkronizasyon otomatik çalışır.
