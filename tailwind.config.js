// @ts-check
import defaultTheme from "tailwindcss/defaultTheme"
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
      const t = lerpInverse(value, start, end)
      const l = lerp(95, 14, t)
      return [value, `oklch(${l}% 15% 290)`]
    }),
  )
}
