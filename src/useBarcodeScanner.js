import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SearchTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = query.trim()
    if (term.length === 0) {
      setResults([])
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`name.ilike.%${term}%,author.ilike.%${term}%,barcode.ilike.%${term}%`)
        .order('name', { ascending: true })
        .limit(30)

      if (!error) setResults(data || [])
      setLoading(false)
    }, 250) // debounce: kullanıcı yazmayı bırakınca ara

    return () => clearTimeout(timeout)
  }, [query])

  // Sonuç listesindeki kitapların stoğu başka bir cihazdan değişirse anlık güncelle
  useEffect(() => {
    const channel = supabase
      .channel('search-tab-books')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, (payload) => {
        setResults((prev) =>
          prev.map((b) => (b.id === payload.new?.id ? { ...b, ...payload.new } : b))
        )
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-950 mb-1">Kitap Sorgula</h2>
      <p className="text-sm text-ink-900/60 mb-4">Ad, yazar veya barkod ile arayın.</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Örn: Suç ve Ceza, Dostoyevski, 978..."
        className="w-full rounded-xl border border-ink-950/15 bg-white px-4 py-3 text-ink-950
          placeholder:text-ink-900/30 focus:outline-none focus:ring-2 focus:ring-brass-500"
      />

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-ink-900/40 px-1">Aranıyor…</p>}

        {!loading && query.trim() && results.length === 0 && (
          <p className="text-sm text-ink-900/40 px-1">Sonuç bulunamadı.</p>
        )}

        {results.map((b) => (
          <div
            key={b.id}
            className="rounded-xl border border-ink-950/10 bg-white p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink-950 truncate">{b.name}</p>
              <p className="text-sm text-ink-900/50 truncate">
                {b.author || 'Yazar yok'} · {b.barcode}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-ink-950">{Number(b.price).toFixed(2)} ₺</p>
              <p className={`text-sm font-medium ${b.stock > 0 ? 'text-forest-700' : 'text-red-600'}`}>
                {b.stock > 0 ? `${b.stock} adet` : 'Tükendi'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
