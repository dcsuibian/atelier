/**
 * 把主内容区滚回顶部。页面滚动发生在布局的 #app-main 上，不是 window
 */
export function scrollToTop(): void {
  const scrollContainer = document.getElementById('app-main')
  if (scrollContainer) {
    scrollContainer.scrollTop = 0
  }
}
