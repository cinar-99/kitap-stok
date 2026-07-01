import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // aynı wifi ağındaki telefondan da dev sunucusuna erişebilmek için
  },
})
