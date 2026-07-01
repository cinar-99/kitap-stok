import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default function RevenueTab() {
  const [sales, setSales] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadInitial() {
    setLoading(true)
    const { data, error } = await supabase
      .from('sales_history')
      .select('*')
      .order('sold_at', { ascending: false })
      .limit(200)

    if (!error && data) {
      setSales(data)
      const total = data.reduce((sum, s) => sum + Number(s.price), 0)
      setTotalRevenue(total)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadInitial()
  }, [])

  // Herhangi bir cihazdan yapılan yeni satış -> ciro ve tablo anında güncellenir
  useEffect(() => {
    const channel = supabase
      .channel('revenue-tab-sales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales_history' },
        (payload) => {
          setSales((prev) => [payload.new, ...prev])
          setTotalRevenue((prev) => prev + Number(payload.new.price))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="font-serif text-2xl font-semibold text-ink-950 mb-1">Ciro & Satış Geçmişi</h2>
      <p className="text-sm text-ink-900/60 mb-6">
        Tüm cihazlardan yapılan satışlar burada anlık olarak toplanır.
      </p>

      <div className="rounded-2xl bg-ink-950 text-paper-50 p-6 mb-6">
        <p className="text-sm uppercase tracking-wide text-paper-50/60">Toplam Kazanılan Para</p>
        <p className="font-serif text-5xl font-bold mt-2">
          {totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </p>
        <p className="text-sm text-paper-50/50 mt-2">{sales.length} satış işlemi</p>
      </div>

      <div className="rounded-xl border border-ink-950/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-950/5 text-ink-900/60">
            <tr>
              <th className="text-left font-medium px-4 py-3">Kitap Adı</th>
              <th className="text-left font-medium px-4 py-3">Barkod</th>
              <th className="text-right font-medium px-4 py-3">Fiyat</th>
              <th className="text-right font-medium px-4 py-3">Tarih / Saat</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-900/40">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-900/40">
                  Henüz satış yapılmadı.
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-ink-950/5">
                <td className="px-4 py-3 font-medium text-ink-950">{s.book_name}</td>
                <td className="px-4 py-3 text-ink-900/50">{s.barcode}</td>
                <td className="px-4 py-3 text-right font-semibold text-ink-950">
                  {Number(s.price).toFixed(2)} ₺
                </td>
                <td className="px-4 py-3 text-right text-ink-900/50">
                  {dateFormatter.format(new Date(s.sold_at))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
