import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_PORT, VITE_BASE_URL, VITE_API_URL, VITE_API_PROXY_URL } = env

  console.log(`🚀 API_URL = ${VITE_API_URL}`)

  return defineConfig({
    base: VITE_BASE_URL,
    server: {
      port: Number(VITE_PORT),
      // 端口被占用时直接报错，不要顺延到下一个：下一个往往就是后端的端口
      strictPort: true,
      proxy: {
        '/api': {
          target: VITE_API_PROXY_URL,
          changeOrigin: true,
          // 后端没有 context-path，接口路径就是 /session、/users，转发时去掉 /api 前缀
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
      host: true,
    },
    // 路径别名
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
      dynamicImportVarsOptions: {
        warnOnError: true,
        exclude: [],
        include: ['src/views/**/*.vue'],
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      // 打包体积分析
      ...('true' === process.env.ANALYZE
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    css: {
      preprocessorOptions: {
        // sass variable and mixin
        scss: {
          additionalData: `
            @use "@/styles/art/el-light.scss" as *;
            @use "@/styles/art/mixin.scss" as *;
          `,
        },
      },
    },
  })
}
