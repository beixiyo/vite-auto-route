import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Playground 直接引用两个本地包的「源码」（通过 alias），改动即时生效，无需先构建：
 * - @jl-org/vite-auto-route → ../src（被审计/修复的本包）
 * - @jl-org/react-router    → ../../react-router/src/router（消费方，用于真实渲染）
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 跨仓库引用源码时，强制 React 单实例，避免「invalid hook call」
    dedupe: ['react', 'react-dom'],
    alias: {
      '@jl-org/vite-auto-route': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      '@jl-org/react-router': fileURLToPath(new URL('../../react-router/src/router/index.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    // 别名指向源码，禁止预打包，保持源码形态
    exclude: ['@jl-org/vite-auto-route', '@jl-org/react-router'],
  },
  server: {
    fs: {
      // 允许读取上层目录里的两个源码包
      allow: [fileURLToPath(new URL('../..', import.meta.url))],
    },
  },
})
