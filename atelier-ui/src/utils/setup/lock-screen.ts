/**
 * 锁屏跟着会话走：确认没登录时解除，否则重新登录后仍被锁着，还得输入上一个人设的密码
 *
 * 锁屏是界面偏好，会话不必知道它的存在，所以由这里订阅会话，而不是让会话登出时顺手清掉
 */
import { watch } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useSettingStore } from '@/stores/setting'

export function setupLockScreen(): void {
  const sessionStore = useSessionStore()
  const settingStore = useSettingStore()
  // 要带上 ready：锁屏状态是持久化的，会话过期后重新打开页面时 isLoggedIn 从头到尾都是 false，光看它等不到变化
  watch(
    () => sessionStore.ready && !sessionStore.isLoggedIn,
    loggedOut => {
      if (loggedOut) {
        settingStore.unlock()
      }
    },
  )
}
