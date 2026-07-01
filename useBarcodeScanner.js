import { useEffect, useRef } from 'react';

/**
 * USB / Bluetooth barkod okuyucular klavye gibi çalışır: 
 * Her karakteri hızla basar ve dizinin sonuna Enter ekler.
 */
export function useBarcodeScanner(onScan, { minLength = 3, maxCharGapMs = 60 } = {}) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const now = Date.now();
      
      // Eğer iki tuş basımı arasında çok uzun süre geçtiyse (elle yazım), buffer'ı temizle
      if (now - lastKeyTimeRef.current > maxCharGapMs) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, minLength, maxCharGapMs]);

  return null;
}
