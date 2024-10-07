// @ts-check
import defaultTheme from "tailwindcss/defaultTheme.js"
import { lerp, lerpInverse, range } from "./lib/common.ts"

/** @satisfies {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik Variable", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          ...oklchPalette(),
        },
      },
    },
  },
  plugins: [],
}

function oklchPalette() {
  const start = 100
  const end = 900
  const step = 100
  return Object.fromEntries(
    range(start, end, step).map((value) => {
      const progress = lerpInverse(value, start, end)
      const lightness = lerp(95, 18, progress ** 0.7)
      const chroma = lerp(15, 12, progress)
      return [value, `oklch(${lightness}% ${chroma}% 290 / <alpha-value>)`]
    }),
  )
}
