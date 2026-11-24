import type { App } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { sanitizePersistedState } from './persist'

export const store = createPinia()

// 顺序不能换：检查要在持久化插件读回数据之前换上
store.use(sanitizePersistedState)
store.use(createPersistedState({ storage: localStorage }))

export function initStore(app: App<Element>): void {
  app.use(store)
}
