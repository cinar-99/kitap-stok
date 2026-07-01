import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SalesTab({ pendingBarcode }) {
  const [book, setBook] = useState(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selling, setSelling] = useState(false)
  const [flash, setFlash] = useState(null) // { type: 'success' | 'error', message }

  async function lookupBarcode(barcode) {
    setLoading(true)
    setNotFoundBarcode(null)
    setFlash(null)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle()

    setLoading(false)
    if (error) {
      setFlash({ type: 'error', message: 'Sorgu hatası: ' + error.message })
      return
    }
    if (!data) {
      setBook(null)
      setNotFoundBarcode(barcode)
      return
    }
    setBook(data)
  }

  // Global barkod okuyucudan gelen her yeni barkodu işle
  useEffect(() => {
    if (pendingBarcode) {
      lookupBarcode(pendingBarcode)
    }
  }, [pendingBarcode])

  // Ekranda bir kitap gösterilirken, başka bir cihaz stoğu değiştirirse
  // (örn. telefon satış yaptıysa) anlık güncelle.
  useEffect(() => {
    if (!book?.barcode) return
    const channel = supabase
      .channel('sales-tab-book-' + book.barcode)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'books', filter: `barcode=eq.${book.barcode}` },
        (payload) => setBook(payload.new)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [book?.barcode])

  async function handleSell() {
    if (!book || book.stock <= 0) return
    setSelling(true)
    setFlash(null)
    const { data, error } = await supabase.rpc('sell_book', { p_barcode: book.barcode })
    setSelling(false)

    if (error) {
      setFlash({ type: 'error', message: 'Satış başarısız: stok muhtemelen tükendi.' })
      return
    }
    const updated = data?.[0]
    if (updated) setBook(updated)
    setFlash({ type: 'success', message: `"${updated?.name}" satıldı ✓` })
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-950 mb-1">Hızlı Satış</h2>
      <p className="text-sm text-ink-900/60 mb-6">
        Barkod okuyucuyu okutun — herhangi bir yere tıklamanıza gerek yok.
      </p>

      {loading && (
        <div className="rounded-xl border border-ink-950/10 bg-white p-6 text-center text-ink-900/60">
          Kitap aranıyor…
        </div>
      )}

      {!loading && notFoundBarcode && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">Kayıt bulunamadı</p>
          <p className="text-sm text-red-700/80 mt-1">
            "{notFoundBarcode}" barkodlu bir kitap veritabanında yok. "Dosya Yükle" sekmesinden
            ekleyebilirsiniz.
          </p>
        </div>
      )}

      {!loading && book && (
        <div className="rounded-2xl border border-ink-950/10 bg-white shadow-sm overflow-hidden">
          <div className="p-6">
            <span className="inline-block text-xs font-semibold uppercase tracking-wide text-brass-600 bg-brass-500/10 px-2 py-1 rounded-full">
              {book.category || 'Kategori yok'}
            </span>
            <h3 className="font-serif text-2xl font-bold text-ink-950 mt-3 leading-snug">
              {book.name}
            </h3>
            <p className="text-ink-900/60 mt-1">{book.author || 'Yazar belirtilmemiş'}</p>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-900/50">Fiyat</p>
                <p className="text-xl font-bold text-ink-950">{Number(book.price).toFixed(2)} ₺</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-ink-900/50">Stok</p>
                <p className={`text-xl font-bold ${book.stock > 0 ? 'text-forest-700' : 'text-red-600'}`}>
                  {book.stock > 0 ? `${book.stock} adet` : 'Tükendi'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSell}
            disabled={book.stock <= 0 || selling}
            className="w-full py-5 text-lg font-bold text-white transition
              disabled:bg-ink-950/20 disabled:cursor-not-allowed
              bg-forest-600 hover:bg-forest-700 active:bg-forest-700"
          >
            {selling ? 'İşleniyor…' : book.stock <= 0 ? 'STOK YOK' : 'SATILDI'}
          </button>
        </div>
      )}

      {!loading && !book && !notFoundBarcode && (
        <div className="rounded-xl border border-dashed border-ink-950/15 p-10 text-center text-ink-900/40">
          Barkod okutmaya hazır…
        </div>
      )}

      {flash && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
            flash.type === 'success'
              ? 'bg-forest-600/10 text-forest-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {flash.message}
        </div>
      )}
    </div>
