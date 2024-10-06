import { startTransition, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"

startTransition(() => {
	createRoot(document.getElementById("root") as HTMLElement).render(
		<Suspense fallback={<p>Loading...</p>}>
			<StrictMode>
				<App />
			</StrictMode>
		</Suspense>,
	)
})
