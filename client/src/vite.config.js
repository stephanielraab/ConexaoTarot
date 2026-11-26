import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Site em http://localhost:3000  ·  API em http://localhost:5000 (via proxy)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // permite abrir pelo IP do PC (ex.: no celular, na mesma rede Wi-Fi)
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
})
