// @ts-check
import defaultTheme from "tailwindcss/defaultTheme"
import { lerp, range } from "./lib/common.ts"

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
          ...Object.fromEntries(
            range(100, 900, 100).map((value) => [
              value,
              `oklch(${lerp(95, 14, ((value - 100) / 800) ** 1)}% 15% 290)`,
            ]),
          ),
        },
      },
    },
  },
  plugins: [],
}
