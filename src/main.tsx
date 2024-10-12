import "@fontsource-variable/rubik/index.css"
import "./main.css"

import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { LoadingIcon } from "./ui/LoadingIcon.tsx"

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
