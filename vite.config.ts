import deno from "@deno/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const host = Deno.env.get("TAURI_DEV_HOST")

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [deno(), react()],
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
