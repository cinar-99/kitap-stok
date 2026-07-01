import { useCallback, useState } from 'react'
import { useBarcodeScanner } from './hooks/useBarcodeScanner'
import SalesTab from './components/SalesTab'
import SearchTab from './components/SearchTab'
import UploadTab from './components/UploadTab'
import RevenueTab from './components/RevenueTab'

const TABS = [
  { id: 'satis', label: 'Hızlı Satış', icon: '⚡' },
  { id: 'arama', label: 'Sorgula', icon: '🔎' },
  { id: 'yukle', label: 'Dosya Yükle', icon: '📥' },
  { id: 'ciro', label: 'Ciro', icon: '💰' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('satis')
  const [pendingBarcode, setPendingBarcode] = useState(null)

  // Global barkod dinleyici: sayfanın HERHANGİ bir yerinde, hiçbir input'a
  // tıklanmadan bile barkod okutulduğunda burası tetiklenir.
  const handleScan = useCallback((barcode) => {
    setActiveTab('satis') // otomatik olarak satış ekranına geç
    // Aynı barkod art arda okutulsa bile useEffect'in tetiklenmesi için
    // her seferinde yeni bir referans/nesne kullanıyoruz.
    setPendingBarcode({ code: barcode, ts: Date.now() })
  }, [])

  useBarcodeScanner(handleScan)

  return (
    <div className="min-h-screen bg-paper-100">
      {/* Üst bar (masaüstü + mobil ortak) */}
      <header className="border-b border-ink-950/10 bg-paper-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-bold text-ink-950">📚 Kitap Dükkanı</h1>
            <p className="text-xs text-ink-900/50">Stok · Satış · Ciro Yönetimi</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 bg-forest-600/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
            Canlı
          </span>
        </div>

        {/* Masaüstü sekme çubuğu */}
        <nav className="max-w-3xl mx-auto px-4 hidden sm:flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-brass-500 text-ink-950'
                  : 'border-transparent text-ink-900/50 hover:text-ink-950'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* İçerik */}
      <main className="pb-24 sm:pb-6">
        {activeTab === 'satis' && <SalesTab pendingBarcode={pendingBarcode?.code} key={pendingBarcode?.ts} />}
        {activeTab === 'arama' && <SearchTab />}
        {activeTab === 'yukle' && <UploadTab />}
        {activeTab === 'ciro' && <RevenueTab />}
      </main>

      {/* Mobil alt sekme çubuğu */}
      <nav className="fixed bottom-0 inset-x-0 sm:hidden bg-paper-50 border-t border-ink-950/10 flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
              activeTab === tab.id ? 'text-brass-600' : 'text-ink-900/40'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
