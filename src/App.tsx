import * as tauriDialog from "@tauri-apps/plugin-dialog"
import { exists } from "@tauri-apps/plugin-fs"
import { use, useState, useTransition } from "react"
import { TaskDb } from "./tasks/task-db.ts"
import { TaskListEditor } from "./tasks/TaskListEditor.tsx"

const lastFilePath = localStorage.getItem("lastFilePath")

const lastTaskDbPromise = lastFilePath
	? TaskDb.fromFile(lastFilePath).catch((error) => {
		console.warn("failed to load recent task db:", error)
		return null
	})
	: Promise.resolve(null)

export function App() {
	const [db, setDb] = useState<TaskDb | null>(
		use(lastTaskDbPromise),
	)

	const handleDbSelected = (db: TaskDb): void => {
		setDb(db)
		localStorage.setItem("lastFilePath", db.file)
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
						const file = await tauriDialog.save({
							defaultPath: "tasks.json",
							filters: [{ name: "JSON", extensions: ["json"] }],
						})

						if (!file) return

						const db = new TaskDb([], file)
						await db.save()
						onDbSelected(db)
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
						const file = await tauriDialog.open({
							filters: [{ name: "JSON", extensions: ["json"] }],
						})
						if (!file) return
						if (!await exists(file)) return

						onDbSelected(await TaskDb.fromFile(file))
					})
				}}
			>
				Open existing tasks file
			</button>
		</main>
	)
}
