/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Base scale using REM units (1rem = 16px by default)
        'xs': ['0.75rem', { lineHeight: '1rem' }],         // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],        // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],      // 36px
        '5xl': ['3rem', { lineHeight: '3rem' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '3.75rem' }],     // 60px
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        'tight': '1.25',
        'normal': '1.5',
        'relaxed': '1.625',
      },
      letterSpacing: {
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        // Text Styles
        '.text-display-large': {
          '@apply text-5xl font-bold leading-tight tracking-tight md:text-6xl': {},
        },
        '.text-display-medium': {
          '@apply text-4xl font-bold leading-tight tracking-tight md:text-5xl': {},
        },
        '.text-heading-1': {
          '@apply text-3xl font-bold leading-tight tracking-tight md:text-4xl': {},
        },
        '.text-heading-2': {
          '@apply text-2xl font-semibold leading-tight tracking-tight md:text-3xl': {},
        },
        '.text-heading-3': {
          '@apply text-xl font-semibold leading-tight tracking-tight md:text-2xl': {},
        },
        '.text-heading-4': {
          '@apply text-lg font-semibold leading-tight tracking-tight md:text-xl': {},
        },
        '.text-body-large': {
          '@apply text-base font-normal leading-relaxed tracking-normal md:text-lg': {},
        },
        '.text-body': {
          '@apply text-sm font-normal leading-relaxed tracking-normal md:text-base': {},
        },
        '.text-body-small': {
          '@apply text-xs font-normal leading-relaxed tracking-normal md:text-sm': {},
        },
        '.text-caption': {
          '@apply text-xs font-normal leading-tight tracking-wide text-gray-500': {},
        },
        '.text-overline': {
          '@apply text-xs font-medium uppercase tracking-wider text-gray-500': {},
        },
      });
    },
  ],
}

