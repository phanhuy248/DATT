export const designTokens = {
  colors: {
    primaryRed: '#D70018',
    darkNavy: '#071A2D',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    softBlue: '#EAF2FF',
    textMain: '#111827',
    textMuted: '#4B5563',
    border: '#E5E7EB',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
  },
  radius: {
    button: '0.75rem',
    card: '1rem',
    section: '1.5rem',
  },
  shadow: {
    card: 'shadow-sm',
    hover: 'hover:shadow-md',
  },
  spacing: {
    sectionGap: 'gap-10 lg:gap-14',
    cardPadding: 'p-5 lg:p-6',
    gridGap: 'gap-5 lg:gap-6',
    buttonHeight: 'h-10 lg:h-12',
  },
}

export const uiClasses = {
  page: 'bg-shop-bg text-shop-text',
  container: 'mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-6',
  card: 'rounded-2xl border border-shop-border bg-shop-surface shadow-sm transition hover:shadow-md',
  section: 'rounded-3xl border border-shop-border bg-shop-surface shadow-sm',
  input:
    'h-11 w-full rounded-xl border border-shop-border bg-shop-surface px-4 text-sm font-medium text-shop-text outline-none transition focus:border-shop-red focus:ring-4 focus:ring-shop-red/10 placeholder:text-shop-muted',
}
