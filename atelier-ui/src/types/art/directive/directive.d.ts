import type { RippleDirective } from '@/directives'

// atelier：删了 vAuth、vRoles、vHighlight，这几个指令已移除
declare module 'vue' {
  export interface GlobalDirectives {
    vRipple: RippleDirective
  }
}
