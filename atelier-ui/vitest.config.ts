import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// 不复用 vite.config.ts：那边的插件初始化比测试本身慢得多。
// 被测代码若依赖自动导入（ref、computed 等），再按需把 AutoImport 加进来
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
