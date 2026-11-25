import { unref, watch } from 'vue'
import { useSettingStore } from '@/stores/setting'
import type { Router } from 'vue-router'
import i18n from '@/locales'
import NProgress from 'nprogress'
import { scrollToTop } from '@/utils/scroll'
import { loadingService } from '@/utils/art/ui'
import { setWorktab } from '@/utils/art/navigation'
import { setPageTitle } from '@/utils/art/router'
import { isChunkLoadError, reloadTo } from '@/router/chunk-error'
import { isStaticRoute } from '@/router/routes/static-routes'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router: Router) {
  router.afterEach((to, from, failure) => {
    // 前置守卫打开的遮罩在这里关：此时懒加载的组件已经就绪。导航失败、取消时也会走到这里
    loadingService.hideLoading()

    // 导航真的完成了才记标签页、改标题，被重定向、取消的不算。静态页面（登录、异常页）不进标签页
    if (!failure && !isStaticRoute(to)) {
      setWorktab(to)
      setPageTitle(to)
    }

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

  // 切换语言不经过导航，标题得另外跟上
  watch(
    () => unref(i18n.global.locale),
    () => {
      const route = router.currentRoute.value
      if (!isStaticRoute(route)) {
        setPageTitle(route)
      }
    },
  )

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
