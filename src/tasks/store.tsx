import { invoke } from "@tauri-apps/api/core"
import { save } from "@tauri-apps/plugin-dialog"
import { exists } from "@tauri-apps/plugin-fs"
import { createContext, use, useState, useTransition } from "react"
import { DEFAULT_TASKS, TaskDb } from "./task-db.ts"
import { createTask } from "./task.ts"

export type TaskStore = ReturnType<typeof useTaskStore>

const lastFilePath = localStorage.getItem("lastFilePath")

const lastTaskDbPromise = lastFilePath
	? TaskDb.fromFile(lastFilePath).catch((error) => {
		console.warn("failed to load recent task db:", error)
		return null
	})
	: Promise.resolve(null)

function useTaskStore() {
	const [db, setDb] = useState<TaskDb | null>(use(lastTaskDbPromise))
	const [input, setInput] = useState("")
	const [tagFilter, setTagFilter] = useState<ReadonlySet<string>>(new Set())
	const [pending, startTransition] = useTransition()

	function updateDb(next: (db: TaskDb) => TaskDb) {
		if (!db) {
			throw new Error("TaskStore not initialized")
		}
		const updated = next(db)
		startTransition(async () => {
			setDb(updated)
			await updated.save()
			localStorage.setItem("lastFilePath", updated.file)
		})
	}

	const actions = {
		init: () => {
			startTransition(async () => {
				const file = await save({
					defaultPath: "tasks.json",
					filters: [
						{ name: "JSON", extensions: ["json"] },
					],
				})

				if (!file) {
					return
				}

				await invoke("add_path_to_fs_scope", { path: file })

				if (await exists(file)) {
					setDb(await TaskDb.fromFile(file))
				} else {
					const db = new TaskDb(DEFAULT_TASKS, file)
					await db.save()
					setDb(db)
				}
			})
		},

		addTask: (text: string) => {
			updateDb((db) => db.withNewTask(createTask(text)))
		},

		removeTask: (id: string) => {
			updateDb((db) => db.withoutTask(id))
		},

		setTaskText: (id: string, text: string) => {
			updateDb((db) => db.withUpdatedTask(id, (it) => ({ ...it, text })))
		},

		setTaskComplete: (id: string, complete: boolean) => {
			updateDb((db) => db.withUpdatedTask(id, (it) => ({ ...it, complete })))
		},

		toggleTaskComplete: (id: string) => {
			updateDb((db) =>
				db.withUpdatedTask(id, (it) => ({ ...it, complete: !it.complete }))
			)
		},

		addTaskTag: (id: string, tag: string) => {
			updateDb((db) =>
				db.withUpdatedTask(id, (it) => ({
					...it,
					tags: [...it.tags, tag],
				}))
			)
		},

		removeTaskTag: (id: string, tag: string) => {
			updateDb((db) =>
				db.withUpdatedTask(id, (it) => ({
					...it,
					tags: it.tags.filter((t) => t !== tag),
				}))
			)
		},
	}

	return {
		...actions,
		pending,
		hasDb: db != null,
		tasks: db?.tasks ?? [],
		input,
		setInput,
		tagFilter,
		setTagFilter,
	}
}

const StoreContext = createContext<TaskStore | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
	const store = useTaskStore()
	return (
		<StoreContext value={store}>
			{children}
		</StoreContext>
	)
}

export function useTaskStoreContext() {
	const store = use(StoreContext)
	if (!store) {
		throw new Error("TaskStore not found")
	}
	return store
}
