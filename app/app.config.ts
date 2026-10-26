export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      neutral: 'zinc'
    },
    // Text fields are 16px on touch devices so iOS never zooms into them on
    // focus. The global rule in main.css covers raw <input>s; this states it
    // where the Nuxt UI sizes are defined, so a size never drops below it.
    input: {
      slots: {
        base: 'pointer-coarse:text-base'
      }
    },
    textarea: {
      slots: {
        base: 'pointer-coarse:text-base'
      }
    },
    selectMenu: {
      slots: {
        input: 'pointer-coarse:text-base'
      }
    },
    inputMenu: {
      slots: {
        base: 'pointer-coarse:text-base'
      }
    },
    // Toasts sit in the bottom-right corner, which the open help panel
    // covers on a desktop; they move over by the panel's width
    // (`--wf-help-offset`, zero whenever the panel is closed).
    toaster: {
      variants: {
        position: {
          'bottom-right': {
            viewport: 'right-[calc(1rem+var(--wf-help-offset,0px))]'
          },
          'top-right': {
            viewport: 'right-[calc(1rem+var(--wf-help-offset,0px))]'
          }
        }
      }
    }
  }
})
