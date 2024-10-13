import "@fontsource-variable/rubik/index.css"
import "./main.css"

import { getCurrentWindow } from "@tauri-apps/api/window"
import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { LoadingIcon } from "./ui/LoadingIcon.tsx"

// @ts-expect-error deno lang server is dumb
if (import.meta.env.DEV) {
	await getCurrentWindow().setTitle("taskaru [dev]")
}

createRoot(document.querySelector("#root") as HTMLElement).render(
	<Suspense fallback={<LoadingCover />}>
		<StrictMode>
			<App />
		</StrictMode>
	</Suspense>,
)

function LoadingCover() {
	return (
		<main className="min-h-screen justify-center flex flex-col items-center">
			<LoadingIcon />
		</main>
	)
}
