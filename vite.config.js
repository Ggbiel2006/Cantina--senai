import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const raiz = (caminho) => fileURLToPath(new URL(caminho, import.meta.url))

// Um projeto, dois sistemas: /aluno/ (celular do estudante) e /cantina/ (painel da atendente).
export default defineConfig({
  plugins: [react()],
  server: { host: true }, // permite abrir no celular pela mesma rede Wi-Fi
  build: {
    rollupOptions: {
      input: {
        inicio: raiz('./index.html'),
        aluno: raiz('./aluno/index.html'),
        cantina: raiz('./cantina/index.html'),
      },
    },
  },
})
