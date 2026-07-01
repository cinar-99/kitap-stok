import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from './supabaseClient.js'

// Excel/CSV başlıkları dükkandan dükkana değişebileceği için, olası Türkçe/İngilizce
// varyasyonları kabul eden esnek bir eşleyici kullanıyoruz.
const HEADER_ALIASES = {
  barcode: ['barkod', 'barcode', 'isbn', 'isbn no', 'isbn13', 'kod'],
  name: ['kitap adı', 'kitap adi', 'ad', 'ürün adı', 'urun adi', 'name', 'title', 'kitap'],
  author: ['yazar', 'author'],
  category: ['kategori', 'category', 'tür', 'tur', 'genre'],
  price: ['fiyat', 'price', 'tutar', 'birim fiyat'],
}

function normalizeHeader(h) {
  return String(h || '')
    .toLocaleLowerCase('tr')
    .trim()
}

function buildHeaderMap(headerRow) {
  const map = {}
  headerRow.forEach((rawHeader, colIndex) => {
    const norm = normalizeHeader(rawHeader)
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(norm) && map[field] === undefined) {
        map[field] = colIndex
      }
    }
  })
  return map
}

function parsePrice(value) {
  if (typeof value === 'number') return value
  if (!value) return 0
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3},)/g, '') // 1.234,56 -> 1234,56 (binlik ayraç temizliği)
    .replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

export default function UploadTab() {
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState(null) // { type, message }
  const [preview, setPreview] = useState(null) // gruplanmış özet (yüklemeden önce gösterilir)
  const [groupedBooks, setGroupedBooks] = useState(null)
  const [uploading, setUploading] = useState(false)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus(null)
    setPreview(null)
    setGroupedBooks(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (rows.length < 2) {
          setStatus({ type: 'error', message: 'Dosyada veri satırı bulunamadı.' })
          return
        }

        const headerMap = buildHeaderMap(rows[0])
        if (headerMap.barcode === undefined) {
          setStatus({
            type: 'error',
            message:
              'Barkod/ISBN sütunu bulunamadı. Başlık satırında "Barkod", "ISBN" veya "Kod" gibi bir sütun olmalı.',
          })
          return
        }

        // === ANA MANTIK: barkod tekrar sayısı = başlangıç stok adedi ===
        const grouped = new Map()
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const rawBarcode = row[headerMap.barcode]
          const barcode = String(rawBarcode || '').trim()
          if (!barcode) continue // boş satırları atla

          if (!grouped.has(barcode)) {
            grouped.set(barcode, {
              barcode,
              name: String(row[headerMap.name] ?? '').trim() || '(Adsız Kitap)',
              author: headerMap.author !== undefined ? String(row[headerMap.author] ?? '').trim() : '',
              category: headerMap.category !== undefined ? String(row[headerMap.category] ?? '').trim() : '',
              price: headerMap.price !== undefined ? parsePrice(row[headerMap.price]) : 0,
              stock: 0,
            })
          }
          grouped.get(barcode).stock += 1 // her tekrar = +1 stok
        }

        const list = Array.from(grouped.values())
        setGroupedBooks(list)
        setPreview({
          totalRows: rows.length - 1,
          uniqueBooks: list.length,
          totalStock: list.reduce((s, b) => s + b.stock, 0),
        })
      } catch (err) {
        setStatus({ type: 'error', message: 'Dosya okunamadı: ' + err.message })
      }
    }
    reader.readAsBinaryString(file)
  }

  async function handleConfirmUpload() {
    if (!groupedBooks?.length) return
    setUploading(true)
    setStatus(null)

    // Supabase upsert: barkod zaten varsa güncelle (fiyat/isim/stok yenilenir),
    // yoksa yeni satır olarak ekle. onConflict: 'barcode' -> unique kısıt gerekli (schema.sql'de var).
    const { error } = await supabase
      .from('books')
      .upsert(groupedBooks, { onConflict: 'barcode' })

    setUploading(false)
    if (error) {
      setStatus({ type: 'error', message: 'Yükleme başarısız: ' + error.message })
      return
    }

    setStatus({
      type: 'success',
      message: `${groupedBooks.length} farklı kitap başarıyla işlendi (toplam ${preview.totalStock} adet stok).`,
    })
    setGroupedBooks(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-950 mb-1">Dosya Yükle</h2>
      <p className="text-sm text-ink-900/60 mb-6">
        Excel (.xlsx) veya CSV yükleyin. Aynı barkod kaç kez geçiyorsa, o kitabın stoğu o kadar
        olarak hesaplanır.
      </p>

      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-ink-950/20 bg-white p-8 text-center hover:border-brass-500 transition">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="font-medium text-ink-950">Dosya seçmek için tıklayın</p>
        <p className="text-sm text-ink-900/40 mt-1">.xlsx, .xls veya .csv</p>
      </label>

      {preview && (
        <div className="mt-5 rounded-xl border border-brass-500/30 bg-brass-500/5 p-5">
          <p className="font-semibold text-ink-950 mb-2">Yükleme Önizlemesi</p>
          <ul className="text-sm text-ink-900/70 space-y-1">
            <li>Okunan satır sayısı: <strong>{preview.totalRows}</strong></li>
            <li>Benzersiz kitap (barkod) sayısı: <strong>{preview.uniqueBooks}</strong></li>
            <li>Hesaplanan toplam stok adedi: <strong>{preview.totalStock}</strong></li>
          </ul>
          <button
            onClick={handleConfirmUpload}
            disabled={uploading}
            className="mt-4 w-full rounded-lg bg-forest-600 py-3 font-semibold text-white
              hover:bg-forest-700 disabled:opacity-50 transition"
          >
            {uploading ? 'Veritabanına yazılıyor…' : 'Onayla ve Veritabanına Yaz'}
          </button>
        </div>
      )}

      {status && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
            status.type === 'success' ? 'bg-forest-600/10 text-forest-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="mt-6 text-xs text-ink-900/40 leading-relaxed">
        Beklenen sütun başlıkları (esnek eşleşir): <strong>Barkod/ISBN</strong>,{' '}
        <strong>Kitap Adı</strong>, <strong>Yazar</strong>, <strong>Kategori</strong>,{' '}
        <strong>Fiyat</strong>. Not: Aynı barkod daha önce veritabanında varsa, bu yükleme
        stoğunu <strong>yeni dosyadaki sayıma göre günceller</strong> (üzerine yazar). Mevcut
        stoğun üzerine eklemek isterseniz UploadTab.jsx içindeki upsert mantığını "stok += "
        şeklinde bir RPC çağrısına dönüştürebilirsiniz.
      </div>
    </div>
  )
}
