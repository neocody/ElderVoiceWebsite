import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const contentSecurityPolicy = [
  "default-src 'self';",
  "base-uri 'self';",
  "style-src 'self' 'unsafe-inline' https:;",
  "font-src 'self' https: data:;",
  "img-src 'self' data: blob: https:;",
  "media-src 'self' blob:;",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;",
  "connect-src 'self' https: wss:;",
  "frame-src 'self' https:;",
  "worker-src 'self' blob:;",
  "object-src 'none';",
  "form-action 'self' https:;",
  "frame-ancestors 'self';",
  "report-uri https://o4509669501698048.ingest.sentry.io/api/4509669501698048/security/?sentry_key=7eb3d90eb4660416caf507087367e67e;",
].join(' ')

const sharedSecurityHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    headers: sharedSecurityHeaders,
  },
  preview: {
    headers: sharedSecurityHeaders,
  },
})
