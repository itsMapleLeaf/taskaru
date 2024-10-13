import * as path from "@tauri-apps/api/path"
import { getCurrentWindow } from "@tauri-apps/api/window"
import * as shell from "@tauri-apps/plugin-shell"
import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { useEffect, useMemo, useReducer, useRef } from "react"
import { match, P } from "ts-pattern"
import { clamp, ensure } from "../../lib/common.ts"
import { Menu } from "../ui/Menu.tsx"
import { TaskDb } from "./task-db.ts"
import { createTask, type Task } from "./task.ts"
import { TaskCard } from "./TaskCard.tsx"

type State = {
	db: TaskDb
	search: string
	tagFilter: ReadonlySet<string>
	// this patches property lets us declaratively update individual tasks at a time
	// without reordering and shifting around the list while updating them
	patches: Record<string, Task>
}

type Action =
	| { type: "inputChanged"; input: string }
	| { type: "taskAdded"; task: Task }
	| { type: "taskRemoved"; taskId: string }
	| { type: "taskChanged"; task: Task }
	| { type: "tagFilterAdded"; tag: string }
	| { type: "tagFilterRemoved"; tag: string }
	| { type: "dbLoaded"; db: TaskDb }

function reducer(state: State, action: Action): State {
	// on individual task updates, only update the patches,
	// and those will get applied to the sorted DB tasks
	// without shifting their order while they're being changed
	if (action.type === "taskChanged") {
		return {
			...state,
			patches: { ...state.patches, [action.task.id]: action.task },
		}
	}

	// on every other update, apply the temporary patches to the db,
	// so that the list will filter and reorder
	// with the newly patched tasks
	state = {
		...state,
		db: state.db.withTasks(
			state.db.tasks
				.map((task) => state.patches[task.id] ?? task)
				.map((task) => ({ ...task, tags: task.tags.toSorted() })),
		),
		patches: {},
	}

	if (action.type === "inputChanged") {
		return {
			...state,
			search: action.input,
		}
	}

	if (action.type === "taskAdded") {
		return {
			...state,
			search: "",
			db: state.db.withNewTask(action.task),
		}
	}

	if (action.type === "taskRemoved") {
		return {
			...state,
			db: state.db.withoutTask(action.taskId),
		}
	}

	if (action.type === "tagFilterAdded") {
		return {
			...state,
			tagFilter: new Set([...state.tagFilter, action.tag]),
		}
	}

	if (action.type === "tagFilterRemoved") {
		const tagFilter = new Set(state.tagFilter)
		tagFilter.delete(action.tag)
		return { ...state, tagFilter }
	}

	if (action.type === "dbLoaded") {
		return {
			...state,
			db: action.db,
			search: "",
			tagFilter: new Set<string>(),
			patches: {},
		}
	}

	action satisfies never
	throw new Error(`unexpected action`, { cause: action })
}

export function TaskListEditor({ initialDb }: { initialDb: TaskDb }) {
	const [state, dispatch] = useReducer(reducer, {
		db: initialDb,
		search: "",
		tagFilter: new Set<string>(),
		patches: {},
	})

	const tasks = matchSorter(state.db.tasks, state.search, {
		keys: ["text", "tags.*"],
		sorter: (items) => {
			return items
				.sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt))
				.sort((a, b) => Number(b.rank) - Number(a.rank))
				.sort((a, b) => Number(a.item.complete) - Number(b.item.complete))
		},
	})
		.filter((task) => state.tagFilter.isSubsetOf(new Set(task.tags)))
		.map((task) => state.patches[task.id] ?? task)

	const patchedDb = useMemo(() => {
		return state.db.withTasks(
			state.db.tasks.map((task) => state.patches[task.id] ?? task),
		)
	}, [state.db, state.patches])

	useEffect(() => {
		patchedDb.save().catch((error) => {
			console.error("Failed to save DB:", error)
		})
	}, [patchedDb])

	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const moveFocus = (
			options: { to: number } | { by: number } | { byClamped: number },
		) => {
			const container = ensure(containerRef.current)

			const focusItems = Array.from(
				container.querySelectorAll<HTMLElement>("[data-focus-item]"),
			)
			const currentIndex = focusItems.findIndex((element) =>
				document.activeElement === element
			)

			const nextIndex = match(options)
				.with({ to: P.number }, ({ to }) => to)
				.with(
					{ by: P.number },
					({ by }) => mod(currentIndex + by, focusItems.length),
				)
				.with(
					{ byClamped: P.number },
					({ byClamped }) =>
						clamp(currentIndex + byClamped, 0, focusItems.length - 1),
				)
				.exhaustive()

			const nextItem = ensure(focusItems.at(nextIndex))
			nextItem.focus()
			if (nextIndex === 0) {
				scrollTo({ top: 0, behavior: "smooth" })
			} else {
				nextItem.scrollIntoView({
					behavior: "smooth",
					block: "center",
				})
			}
		}

		const controller = new AbortController()

		addEventListener("keydown", (event) => {
			const isInput = event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement

			const isAtStartOfInput = isInput &&
				event.target.selectionStart === 0

			const isAtEndOfInput = isInput &&
				event.target.selectionStart === event.target.value.length

			match(event)
				.with({ key: "ArrowUp" }, () => {
					if (!isInput || isAtStartOfInput) {
						event.preventDefault()
						moveFocus({ by: -1 })
					}
				})
				.with({ key: "ArrowDown" }, () => {
					if (!isInput || isAtEndOfInput) {
						event.preventDefault()
						moveFocus({ by: 1 })
					}
				})
				.with({ key: "Home" }, () => {
					if (!isInput || isAtStartOfInput) {
						event.preventDefault()
						moveFocus({ to: 0 })
					}
				})
				.with({ key: "End" }, () => {
					if (!isInput || isAtEndOfInput) {
						event.preventDefault()
						moveFocus({ to: -1 })
					}
				})
				.with({
					key: "Enter",
					shiftKey: false,
					target: P.instanceOf(HTMLElement).and(
						P.shape({
							dataset: { taskId: P.string },
						}),
					),
				}, (event) => {
					event.preventDefault()
					const task = patchedDb.tasks.find((t) =>
						t.id === event.target.dataset.taskId
					)!
					dispatch({
						type: "taskChanged",
						task: { ...task, complete: !task.complete },
					})
				})
				.otherwise(() => {})
		}, { signal: controller.signal })

		return () => {
			controller.abort()
		}
	})

	const handleOpenFile = async () => {
		const newDb = await TaskDb.openWithFilePicker()
		if (newDb) {
			dispatch({ type: "dbLoaded", db: newDb })
		}
	}

	const handleSaveAs = async () => {
		const newDb = await TaskDb.saveWithFilePicker(patchedDb)
		if (newDb) {
			dispatch({ type: "dbLoaded", db: newDb })
		}
	}

	const handleOpenDataFolder = async () => {
		try {
			const dataDir = await path.appDataDir()
			await shell.open(dataDir)
		} catch (error) {
			console.error(
				"Failed to open data folder:",
				error,
			)
		}
	}
	return (
		<div
			className="
			isolate pb-8
			[--content-width:720px]
			[--pl:theme(spacing.2)]
			[--pr:theme(spacing.14)]
		"
			ref={containerRef}
		>
			<header className="sticky top-0 bg-primary-900 z-10 pt-4 pb-2 flex flex-col gap-4">
				<div className="relative pl-[var(--pl)] pr-[var(--pr)] max-w-[var(--content-width)] mx-auto w-full">
					<div className="flex relative">
						<div className="left-full px-2 absolute self-center">
							<Menu placement="bottom-end">
								<Menu.Button className="button button-clear button-square">
									<Lucide.Menu />
								</Menu.Button>
								<Menu.Panel>
									<Menu.Item
										icon={<Lucide.FolderOpen />}
										onClick={handleOpenFile}
									>
										Open
									</Menu.Item>
									<Menu.Item
										icon={<Lucide.Save />}
										onClick={handleSaveAs}
									>
										Save as...
									</Menu.Item>
									<Menu.Separator />
									<Menu.Item
										icon={<Lucide.Code2 />}
										onClick={handleOpenDataFolder}
									>
										Open data folder
									</Menu.Item>
									<Menu.Separator />
									<Menu.Item
										icon={<Lucide.DoorOpen />}
										onClick={() => getCurrentWindow().close()}
									>
										Quit
									</Menu.Item>
								</Menu.Panel>
							</Menu>
						</div>
						<textarea
							className="textarea text-lg"
							rows={1}
							placeholder="What's next?"
							data-focus-item
							value={state.search}
							onChange={(event) =>
								dispatch({
									type: "inputChanged",
									input: event.target.value,
								})}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" && !event.shiftKey &&
									!event.ctrlKey
								) {
									event.preventDefault()
									const newTask = createTask(
										event.currentTarget.value,
										[
											...state.tagFilter,
										],
									)
									dispatch({ type: "taskAdded", task: newTask })
								}
							}}
						/>
					</div>
				</div>

				<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden pl-[var(--pl)] pr-[var(--pr)] max-w-[var(--content-width)]  mx-auto w-full">
					{[...state.tagFilter].toSorted().map((tag) => (
						<li key={tag}>
							<button
								type="button"
								className="block text-sm text-primary-300 hover:underline relative focus-visible:outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
								onClick={() =>
									dispatch({ type: "tagFilterRemoved", tag })}
							>
								#{tag}
							</button>
						</li>
					))}
				</ul>
			</header>

			<ul className="flex flex-col gap-4 pl-[var(--pl)] pr-[var(--pr)] max-w-[var(--content-width)] mx-auto w-full py-2">
				{tasks.map((task) => (
					<li key={task.id}>
						<TaskCard
							task={task}
							onChange={(task) =>
								dispatch({ type: "taskChanged", task })}
							onRemove={(taskId) =>
								dispatch({ type: "taskRemoved", taskId })}
							onTagClick={(tag) =>
								dispatch({ type: "tagFilterAdded", tag })}
						/>
					</li>
				))}
			</ul>
		</div>
	)
}

function mod(a: number, b: number) {
	return ((a % b) + b) % b
}
