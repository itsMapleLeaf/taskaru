import { LucideLoader2 } from "lucide-react"
import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"

createRoot(document.getElementById("root") as HTMLElement).render(
	<Suspense
		fallback={
			<main className="absolute inset-0 h-screen justify-center flex flex-col items-center">
				<LucideLoader2 className="w-32 h-32 text-primary-600 animate-spin" />
			</main>
		}
	>
		<StrictMode>
			<App />
		</StrictMode>
	</Suspense>,
)
