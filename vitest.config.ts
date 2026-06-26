import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * 单测默认 node 环境（纯函数库）；集成测试文件用
 * `// @vitest-environment jsdom` 自行声明，仅该文件切到 jsdom。
 *
 * 集成测试需在 jsdom 里真实渲染消费方 @jl-org/react-router 的源码，
 * 故复用 playground/vite.config.ts 的跨仓库源码引用方案：
 * - alias  指向消费方源码入口
 * - dedupe 强制 React 单实例，避免「invalid hook call」
 * - jsx    用 automatic runtime（本仓库 tsconfig 未配 jsx，需显式开启）
 * - fs.allow 放开上层目录，允许读取相邻仓库的源码与其 node_modules
 */
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@jl-org/react-router': fileURLToPath(new URL('../react-router/src/router/index.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['@jl-org/react-router'],
  },
  server: {
    fs: {
      // `..` 为同时容纳两个仓库的上层目录
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'playground'],
    server: {
      deps: {
        // 消费方以源码（非 node_modules）形式被引入，需 inline 让 vitest 转译
        inline: [/react-router/],
      },
    },
  },
})
