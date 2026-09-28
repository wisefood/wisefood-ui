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
    }
  }
})
