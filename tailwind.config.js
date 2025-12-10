// Tailwind configuration with WiseFood brand tokens and earth palette
export default {
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        brandg: 'var(--brandg)',
        earth: {
          1: 'var(--earth-1)',
          2: 'var(--earth-2)',
        },
        terracotta: 'var(--terracotta)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        'card': 'var(--radius)',
      },
      spacing: {
        'card': '1.5rem',
      },
    },
  },
}
