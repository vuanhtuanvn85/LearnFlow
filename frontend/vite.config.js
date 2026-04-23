import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Dev: dùng /learnflow/ để proxy đúng với backend local
  // Production: root / vì Render Static Site serve từ root
  base: command === 'serve' ? '/learnflow/' : '/',
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
    },
  },
}))
