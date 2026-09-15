/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// O plugin VitePWA roda apenas fora do Vitest: sob `vitest run`/`vitest`,
// a variável VITEST é definida pelo próprio Vitest, e o plugin (que espera
// um ciclo de vida de build/dev completo) não precisa nem deve participar
// da transformação dos testes.
const semVitest = process.env.VITEST === undefined;

export default defineConfig({
  plugins: [
    react(),
    ...(semVitest
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icone.svg', 'icones/icone-192.png', 'icones/icone-512.png'],
            manifest: {
              name: 'Fornalha Metabólica',
              short_name: 'Fornalha',
              description:
                'Diário local de hábitos ligados à densidade mitocondrial. Não prescreve; mostra onde você está e o próximo passo.',
              lang: 'pt-BR',
              start_url: '/',
              display: 'standalone',
              background_color: '#F5F6F3',
              theme_color: '#1C2421',
              icons: [
                { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icones/icone-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,json}'],
              navigateFallback: 'index.html',
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
