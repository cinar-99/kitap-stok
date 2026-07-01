import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useBarcodeScanner } from './useBarcodeScanner'

export default function SalesTab() {
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(false)

  useBarcodeScanner((barcode) => {
    lookupBarcode(barcode)
  })

  async function lookupBarcode(barcode) {
    setLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle()
    
    setBook(data)
    setLoading(false)
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Hızlı Satış</h1>
      {loading ? (
        <p>Aranıyor...</p>
      ) : book ? (
        <div className="mt-4 border p-4">
          <p>Kitap: {book.name}</p>
          <p>Fiyat: {book.price} ₺</p>
        </div>
      ) : (
        <p>Barkod okutmaya hazır...</p>
      )}
    </div>
  )
}
