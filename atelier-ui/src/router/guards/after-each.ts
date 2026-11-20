import { useSettingStore } from '@/stores/setting'
import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { useCommon } from '@/hooks/core/useCommon'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router: Router) {
  const { scrollToTop } = useCommon()

  router.afterEach((to, from) => {
    // 只改 query 的导航（筛选、分页同步到 URL）不算换页，回到顶部会打断操作
    if (to.path !== from.path) {
      scrollToTop()
    }

    // 关闭进度条
    const settingStore = useSettingStore()
    if (settingStore.showNprogress) {
      NProgress.done()
      // 确保进度条完全移除，避免残影
      setTimeout(() => {
        NProgress.remove()
      }, 600)
    }
  })
}
