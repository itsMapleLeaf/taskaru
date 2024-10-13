import { use, useState, useTransition } from "react"
import { loadAppState, updateAppState } from "./app-state.ts"
import { TaskDb } from "./tasks/task-db.ts"
import { TaskListEditor } from "./tasks/TaskListEditor.tsx"

const lastTaskDbPromise = (async () => {
	const { lastFile } = await loadAppState()
	if (!lastFile) return

	return await TaskDb.fromFile(lastFile).catch((error) => {
		console.warn("failed to load recent task db:", error)
		return null
	})
})()

export function App() {
	const [db, setDb] = useState<TaskDb | null | undefined>(
		use(lastTaskDbPromise),
	)

	const handleDbSelected = (db: TaskDb): void => {
		setDb(db)
		updateAppState({ lastFile: db.file })
	}

	return db
		? <TaskListEditor initialDb={db} />
		: <Onboarding onDbSelected={handleDbSelected} />
}

function Onboarding({
	onDbSelected,
}: {
	onDbSelected: (db: TaskDb) => void
}) {
	const [pending, startTransition] = useTransition()
	return (
		<main className="min-h-screen flex justify-center flex-col items-center gap-4">
			<button
				type="button"
				className="button button-lg"
				disabled={pending}
				onClick={() => {
					startTransition(async () => {
						const db = await TaskDb.saveWithFilePicker(new TaskDb([], ""))
						if (db) {
							onDbSelected(db)
						}
					})
				}}
			>
				Create new tasks file
			</button>
			<p>or</p>
			<button
				type="button"
				className="button button-lg"
				disabled={pending}
				onClick={() => {
					startTransition(async () => {
						const db = await TaskDb.openWithFilePicker()
						if (db) {
							onDbSelected(db)
						}
					})
				}}
			>
				Open existing tasks file
			</button>
		</main>
	)
}
