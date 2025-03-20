import { withTV } from 'tailwind-variants/transformer'
import { Config } from 'tailwindcss'

const CONFIG: Config = withTV({
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx,css}',
    './pages/**/*.{js,jsx,ts,tsx,css}',
    './layouts/**/*.{js,jsx,ts,tsx,css}',
    './components/**/*.{js,jsx,ts,tsx,css}',
    './helpers/**/*.{js,jsx,ts,tsx,css}',
    './contexts/**/*.{js,jsx,ts,tsx,css}',
    './styles/**/*.{js,jsx,ts,tsx,css}',
  ],
})

export default CONFIG
