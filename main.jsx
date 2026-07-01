import { useEffect, useRef } from 'react'

/**
 * USB / Bluetooth barkod okuyucular klavye gibi çalışır: her karakteri hızlıca
 * (genelde <30ms aralıklarla) basar ve dizinin sonuna Enter ekler.
 * Bu hook, kullanıcı ekranda herhangi bir input'a TIKLAMASA BİLE, tüm sayfa
 * genelinde (window) klavye olaylarını dinler, karakterleri bir tampona (buffer)
 * toplar ve Enter geldiğinde -eğer yazım hızı "insan hızından" belirgin şekilde
 * yüksekse- bunu barkod okuması olarak kabul edip onScan callback'ini tetikler.
 *
 * İnsan bir input'a normal hızda yazıyorsa (örn. arama kutusuna elle yazarken),
 * karakterler arası süre uzun olacağından bu buffer "barkod" olarak yorumlanmaz
 * ve normal yazma davranışına karışılmaz.
 */
export function useBarcodeScanner(onScan, { minLength = 3, maxCharGapMs = 60 } = {}) {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)

  useEffect(() => {
    function handleKeyDown(e) {
      const now = Date.now()
      const gap = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Kullanıcı bir textarea/input içinde normal metin düzenliyorsa (örn. imleç
      // hareketleri, kısayollar) bu tuşları tampon mantığına dahil etmiyoruz.
      const isModifier = e.ctrlKey || e.altKey || e.metaKey
      if (isModifier) return

      if (e.key === 'Enter') {
        const value = bufferRef.current
        bufferRef.current = ''
        if (value.length >= minLength) {
          // Sadece son karakterin de "hızlı" gelip gelmediğine bakmaya gerek yok;
          // buffer zaten sadece hızlı ardışık tuşlarla büyüyor (aşağıda temizleniyor).
          onScan(value.trim())
        }
        return
      }

      // Tek karakterlik, yazdırılabilir tuşlar (rakam/harf/tire vs.)
      if (e.key.length === 1) {
        // Eğer önceki tuştan bu yana geçen süre insan yazım hızından çok uzunsa,
        // bu yeni bir yazım oturumu olarak kabul edilir ve buffer sıfırlanır.
        if (gap > maxCharGapMs && bufferRef.current.length > 0) {
          bufferRef.current = ''
        }
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onScan, minLength, maxCharGapMs])
}
