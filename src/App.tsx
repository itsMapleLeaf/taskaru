import { save } from "@tauri-apps/plugin-dialog"
import { startTransition, use, useActionState } from "react"
import {
	loadRecentTaskDb,
	loadTaskDb,
	saveTaskDb,
	setTasks,
	type Task,
	type TaskDb,
} from "./task-db.ts"
import { TaskListEditor } from "./TaskListEditor.tsx"

let recentTaskDbPromise: Promise<TaskDb | null>

export function App() {
	const initialTaskDb = use(
		recentTaskDbPromise ??= loadRecentTaskDb().catch((error) => {
			console.warn("failed to load recent task db:", error)
			return null
		}),
	)

	const [taskDb, dispatch, pending] = useActionState(
		async (
			current: TaskDb | null,
			action:
				| { type: "setupDb" }
				| { type: "setTasks"; tasks: readonly Task[] },
		) => {
			if (action.type === "setupDb") {
				const file = await save({
					defaultPath: "tasks.json",
					filters: [
						{ name: "JSON", extensions: ["json"] },
					],
				})
				if (!file) return null
				return await loadTaskDb(file)
			}
			if (action.type === "setTasks") {
				const db = setTasks(current!, action.tasks)
				await saveTaskDb(db)
				return db
			}
			return current
		},
		initialTaskDb,
	)

	return taskDb
		? (
			<TaskListEditor
				tasks={taskDb.tasks}
				setTasks={(tasks) => {
					startTransition(() => {
						dispatch({ type: "setTasks", tasks })
					})
				}}
			/>
		)
		: (
			<main className="absolute inset-0 flex flex-col items-center gap-4">
				<p>Choose a location to save your tasks.</p>
				<button
					type="button"
					className="bg-primary-800 focus:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg h-14 px-4 text-xl disabled:opacity-50"
					disabled={pending}
					onClick={() => {
						startTransition(() => {
							dispatch({ type: "setupDb" })
						})
					}}
				>
					Choose location
				</button>
			</main>
		)
}
