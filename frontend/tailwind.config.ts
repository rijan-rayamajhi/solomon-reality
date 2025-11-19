import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light Luxury Palette
        background: {
          DEFAULT: '#FAFAFC',
          muted: '#F2F4F7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F2F4F7',
        },
        text: {
          primary: '#1E1E1E',
          secondary: '#5F6B7A',
        },
        accent: {
          primary: '#5B5F97',
          'primary-hover': '#7A80B8',
          secondary: '#8BD3DD',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F2F4F7',
        },
        success: '#6EC1A6',
        error: '#EF7C79',
        warning: '#F9C97A',
        // Legacy support (will be replaced gradually)
        luxury: {
          gold: '#5B5F97',
          'gold-dark': '#7A80B8',
        },
        dark: {
          DEFAULT: '#FAFAFC',
          lighter: '#FFFFFF',
          lightest: '#F2F4F7',
        },
      },
      fontFamily: {
        display: ['Urbanist', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['32px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.6', fontWeight: '500' }],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.1)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.15)',
        'glow-accent': '0 0 24px rgba(91, 95, 151, 0.2)',
        'glow-gold': '0 0 24px rgba(91, 95, 151, 0.2)',
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'pill': '9999px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5B5F97 0%, #8BD3DD 100%)',
        'gradient-soft': 'linear-gradient(180deg, #FAFAFC 0%, #F2F4F7 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.22, 0.9, 0.38, 1)',
      },
      backdropBlur: {
        'apple': '20px',
      },
      transitionProperty: {
        'all': 'all',
      },
    },
  },
  plugins: [],
}
export default config

