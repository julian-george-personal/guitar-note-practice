import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function injectCapacitorMeta(): Plugin {
  return {
    name: 'capacitor-meta',
    transformIndexHtml: (html) =>
      process.env.CAPACITOR
        ? {
            html,
            tags: [
              { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }, injectTo: 'head' as const },
            ],
          }
        : html,
  }
}

export default defineConfig({
  root: 'web',
  base: './',
  plugins: [react(), injectCapacitorMeta()],
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
})
