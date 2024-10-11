import {
	Menu,
	MenuItem,
	PredefinedMenuItem,
	Submenu,
} from "@tauri-apps/api/menu"
import { getCurrentWindow } from "@tauri-apps/api/window"
import * as tauriDialog from "@tauri-apps/plugin-dialog"
import { exists } from "@tauri-apps/plugin-fs"
import {
	createContext,
	use,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react"
import { TaskDb } from "./task-db.ts"
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
	const hasDb = db != null
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

		open: () => {
			startTransition(async () => {
				const file = await tauriDialog.open({
					filters: [{ name: "JSON", extensions: ["json"] }],
				})

				if (!file) return

				if (await exists(file)) {
					setDb(await TaskDb.fromFile(file))
					localStorage.setItem("lastFilePath", file)
				}
			})
		},

		save: () => {
			if (!db) {
				actions.saveAs()
				return
			}

			startTransition(async () => {
				await db.save()
			})
		},

		saveAs: () => {
			startTransition(async () => {
				const file = await tauriDialog.save({
					defaultPath: "tasks.json",
					filters: [{ name: "JSON", extensions: ["json"] }],
				})

				if (!file) return

				const updatedDb = db ? new TaskDb(db.tasks, file) : new TaskDb([], file)
				await updatedDb.save()
				setDb(updatedDb)
				localStorage.setItem("lastFilePath", file)
			})
		},

		close: () => {
			setDb(null)
		},

		quit: () => {
			getCurrentWindow().close()
		},
	}
	const actionsRef = useLatestRef(actions)

	useEffect(() => {
		let cancelled = false

		void (async () => {
			const fileMenu = await Submenu.new({
				text: "File",
			})

			await fileMenu.append([
				await MenuItem.new({
					text: "Open...",
					accelerator: "CmdOrCtrl+O",
					action: () => actionsRef.current.open(),
				}),
				hasDb && await MenuItem.new({
					text: "Save",
					accelerator: "CmdOrCtrl+S",
					action: () => actionsRef.current.save(),
				}),
				hasDb && await MenuItem.new({
					text: "Save as...",
					accelerator: "CmdOrCtrl+Shift+S",
					action: () => actionsRef.current.saveAs(),
				}),
				hasDb && await MenuItem.new({
					text: "Close",
					accelerator: "CmdOrCtrl+W",
					action: () => actionsRef.current.close(),
				}),
				await PredefinedMenuItem.new({
					item: "Separator",
				}),
				await PredefinedMenuItem.new({ item: "Quit" }),
			].filter(Boolean))

			const helpMenu = await Submenu.new({ text: "Help" })

			helpMenu.append([
				await MenuItem.new({
					text: "About",
					action: async () => {
						const metadata = await import("../../src-tauri/tauri.conf.json")
						tauriDialog.message(
							`${metadata.default.productName} v${metadata.default.version}`,
							{
								kind: "info",
								okLabel: "thanks",
							},
						)
					},
				}),
			])

			const menu = await Menu.new({
				items: [fileMenu, helpMenu],
			})

			if (!cancelled) {
				const win = getCurrentWindow()
				await menu.setAsWindowMenu(win)
				await menu.setAsAppMenu()
			}
		})()

		return () => {
			cancelled = true
		}
	}, [actionsRef, hasDb])

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

function useLatestRef<T>(value: T) {
	const ref = useRef<T>(value)
	useEffect(() => {
		ref.current = value
	})
	return ref
}
