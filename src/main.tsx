import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { StoreProvider } from "./tasks/store.tsx"
import { LoadingIcon } from "./ui/LoadingIcon.tsx"

createRoot(document.getElementById("root") as HTMLElement).render(
	<Suspense
		fallback={
			<main className="absolute inset-0 h-screen justify-center flex flex-col items-center">
				<LoadingIcon />
			</main>
		}
	>
		<StrictMode>
			<StoreProvider>
				<App />
			</StoreProvider>
		</StrictMode>
	</Suspense>,
)
