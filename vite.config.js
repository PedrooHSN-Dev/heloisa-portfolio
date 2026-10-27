import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' deixa o site funcionar em qualquer hospedagem (raiz ou subpasta).
export default defineConfig({
  base: './',
  plugins: [react()],
})
