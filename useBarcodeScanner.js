import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan) {
  const bufferRef = useRef('');
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (bufferRef.current.length > 0) {
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
