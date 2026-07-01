import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan, { minLength = 3, maxCharGapMs = 60 } = {}) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const now = Date.now();
      
      // Eğer iki tuş basımı arasında çok uzun süre geçtiyse (elle yazım durumu), buffer'ı temizle
      if (now - lastKeyTimeRef.current > maxCharGapMs) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      // Enter tuşu barkodun bittiğini gösterir
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        // Sadece tek karakterleri ekle (Shift, Ctrl vb. engellemek için)
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, minLength, maxCharGapMs]);

  return null;
}
