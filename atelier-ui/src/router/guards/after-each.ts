import { useSettingStore } from '@/stores/setting'
import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { scrollToTop } from '@/utils/scroll'
import { loadingService } from '@/utils/art/ui'
import { isChunkLoadError, reloadTo } from '@/router/chunk-error'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router: Router) {
  router.afterEach((to, from) => {
    // 前置守卫打开的遮罩在这里关：此时懒加载的组件已经就绪。导航失败、取消时也会走到这里
    loadingService.hideLoading()

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

  // 懒加载组件下载失败等异常不会触发 afterEach，遮罩得另外关。
  // 注册了 onError 后 vue-router 不再自己打印错误，这里补上
  router.onError((error, to) => {
    if (isChunkLoadError(error) && reloadTo(to.fullPath)) {
      return
    }
    loadingService.hideLoading()
    console.error('[Router] 导航出错', error)
  })
}
