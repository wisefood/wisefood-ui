import { defineStore } from 'pinia'

export type FontScale = 'sm' | 'md' | 'lg' | 'xl'
export type ContrastMode = 'normal' | 'high' | 'grayscale'

interface AccessibilityState {
  fontScale: FontScale
  contrast: ContrastMode
  dyslexiaFont: boolean
  reducedMotion: boolean
  underlineLinks: boolean
  largeCursor: boolean
}

const STORAGE_KEY = 'wisefood_a11y'

const DEFAULTS: AccessibilityState = {
  fontScale: 'md',
  contrast: 'normal',
  dyslexiaFont: false,
  reducedMotion: false,
  underlineLinks: false,
  largeCursor: false
}

const FONT_SCALE_VALUE: Record<FontScale, string> = {
  sm: '0.85',
  md: '1',
  lg: '1.25',
  xl: '1.5'
}

function loadFromStorage(): AccessibilityState {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<AccessibilityState>
    // Migrate the retired 'inverted' contrast option to 'grayscale'.
    if ((parsed.contrast as string) === 'inverted') parsed.contrast = 'grayscale'
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

export const useAccessibilityStore = defineStore('accessibility', {
  state: (): AccessibilityState => loadFromStorage(),
  actions: {
    setFontScale(scale: FontScale) {
      this.fontScale = scale
      this.persist()
      this.apply()
    },
    setContrast(mode: ContrastMode) {
      this.contrast = mode
      this.persist()
      this.apply()
    },
    toggleDyslexiaFont() {
      this.dyslexiaFont = !this.dyslexiaFont
      this.persist()
      this.apply()
    },
    toggleReducedMotion() {
      this.reducedMotion = !this.reducedMotion
      this.persist()
      this.apply()
    },
    toggleUnderlineLinks() {
      this.underlineLinks = !this.underlineLinks
      this.persist()
      this.apply()
    },
    toggleLargeCursor() {
      this.largeCursor = !this.largeCursor
      this.persist()
      this.apply()
    },
    reset() {
      Object.assign(this, DEFAULTS)
      this.persist()
      this.apply()
    },
    persist() {
      if (typeof window === 'undefined') return
      const { fontScale, contrast, dyslexiaFont, reducedMotion, underlineLinks, largeCursor } = this
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fontScale, contrast, dyslexiaFont, reducedMotion, underlineLinks, largeCursor })
      )
    },
    apply() {
      if (typeof document === 'undefined') return
      const root = document.documentElement

      root.style.setProperty('--a11y-font-scale', FONT_SCALE_VALUE[this.fontScale])

      root.classList.toggle('a11y-contrast-high', this.contrast === 'high')
      root.classList.toggle('a11y-grayscale', this.contrast === 'grayscale')
      root.classList.toggle('a11y-dyslexia-font', this.dyslexiaFont)
      root.classList.toggle('a11y-reduced-motion', this.reducedMotion)
      root.classList.toggle('a11y-underline-links', this.underlineLinks)
      root.classList.toggle('a11y-large-cursor', this.largeCursor)
    }
  }
})
