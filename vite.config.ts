import deno from "@deno/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const host = Deno.env.get("TAURI_DEV_HOST")

// https://vitejs.dev/config/
export default defineConfig({
	// @ts-expect-error: vite plugin types keep exploding
	plugins: [deno(), react(), tailwindcss()],
	clearScreen: false,
	server: {
		port: 5173,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
				protocol: "ws",
				host,
				port: 1421,
			}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
})
