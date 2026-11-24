import { useSettingStore } from '@/stores/setting'
import { MenuTheme, MenuType } from '@/constants/app'

/**
 * 设置状态管理
 */
export function useSettingsState() {
  const settingStore = useSettingStore()

  // 色弱模式初始化
  const initColorWeak = () => {
    if (settingStore.colorWeak) {
      const el = document.getElementsByTagName('html')[0]
      setTimeout(() => {
        el.classList.add('color-weak')
      }, 100)
    }
  }

  // 菜单布局切换
  const switchMenuLayouts = (type: MenuType) => {
    if (type === MenuType.LEFT || type === MenuType.TOP_LEFT) {
      settingStore.setMenuOpen(true)
    }
    settingStore.switchMenuLayouts(type)
    if (type === MenuType.DUAL_MENU) {
      settingStore.switchMenuStyles(MenuTheme.DESIGN)
      settingStore.setMenuOpen(true)
    }
  }

  return {
    // 方法
    initColorWeak,
    switchMenuLayouts,
  }
}
