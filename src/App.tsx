import { useTaskStoreContext } from "./tasks/store.tsx"
import { TaskListEditor } from "./tasks/TaskListEditor.tsx"

export function App() {
	return (
		<OnboardingGuard>
			<TaskListEditor />
		</OnboardingGuard>
	)
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
	const store = useTaskStoreContext()

	if (store.hasDb) {
		return children
	}

	return (
		<main className="absolute inset-0 flex justify-center flex-col items-center gap-4">
			<p>Choose a location to save your tasks.</p>
			<button
				type="button"
				className="bg-primary-800 rounded-lg h-14 px-4 text-xl disabled:opacity-50 hover:bg-primary-700 active:bg-primary-600 active:duration-0 transition"
				onClick={() => {
					store.init()
				}}
			>
				Choose location
			</button>
		</main>
	)
}
