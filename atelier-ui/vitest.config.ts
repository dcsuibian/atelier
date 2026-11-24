import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 不复用 vite.config.ts：那边的插件初始化比测试本身慢得多。
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
