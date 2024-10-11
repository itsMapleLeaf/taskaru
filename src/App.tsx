import { StrictMode, Suspense } from "react"
import { StoreProvider, useTaskStoreContext } from "./tasks/store.tsx"
import { TaskListEditor } from "./tasks/TaskListEditor.tsx"
import { LoadingIcon } from "./ui/LoadingIcon.tsx"

export function App() {
	return (
		<Suspense fallback={<LoadingCover />}>
			<StrictMode>
				<StoreProvider>
					<OnboardingGuard>
						<TaskListEditor />
					</OnboardingGuard>
				</StoreProvider>
			</StrictMode>
		</Suspense>
	)
}

function LoadingCover() {
	return (
		<main className="absolute inset-0 h-screen justify-center flex flex-col items-center">
			<LoadingIcon />
		</main>
	)
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
	const store = useTaskStoreContext()

	if (store.hasDb) {
		return children
	}

	return (
		<main className="absolute inset-0 flex justify-center flex-col items-center gap-4">
			<button
				type="button"
				className="button button-lg"
				onClick={() => {
					store.saveAs()
				}}
			>
				Create new tasks file
			</button>
			<p>or</p>
			<button
				type="button"
				className="button button-lg"
				onClick={() => {
					store.open()
				}}
			>
				Open existing tasks file
			</button>
		</main>
	)
}
