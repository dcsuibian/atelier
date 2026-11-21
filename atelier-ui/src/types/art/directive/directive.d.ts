import type { RippleDirective, HighlightDirective } from '@/directives'

// atelier：删了 vAuth、vRoles，两个指令已移除
declare module 'vue' {
  export interface GlobalDirectives {
    vRipple: RippleDirective
    vHighlight: HighlightDirective
  }
}
