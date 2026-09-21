import type { AuthDirective, RippleDirective, HighlightDirective } from '@/directives'

declare module 'vue' {
  export interface GlobalDirectives {
    vAuth: AuthDirective
    vRipple: RippleDirective
    vHighlight: HighlightDirective
  }
}
