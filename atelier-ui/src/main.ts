import App from './App.vue'
import { createApp } from 'vue'
import { initStore } from '@/stores' // Store
import { initRouter } from './router' // Router
import language from './locales' // 国际化
import '@/styles/art/tailwind.css' // tailwind
import '@/styles/index.scss' // 样式
import { vRipple } from '@/directives/ripple'
import { setupErrorHandle } from '@/utils/setup/error-handle'
import { setupHttp } from '@/utils/setup/http'
import { setupLockScreen } from '@/utils/setup/lock-screen'

document.addEventListener('touchstart', function () {}, { passive: false })

const app = createApp(App)
initStore(app)
setupHttp() // http 层的失败提示与 401 处理
setupLockScreen()
initRouter(app)
app.directive('ripple', vRipple)
setupErrorHandle(app)

app.use(language)
app.mount('#app')
