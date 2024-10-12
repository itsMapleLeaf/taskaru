import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { useEffect, useMemo, useReducer, useRef } from "react"
import { match, P } from "ts-pattern"
import { clamp, ensure } from "../../lib/common.ts"
import type { TaskDb } from "./task-db.ts"
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
			state.db.tasks.map((task) => state.patches[task.id] ?? task),
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
		.filter(
			(task) =>
				state.tagFilter.size === 0 ||
				task.tags.some((tag) => state.tagFilter.has(tag)),
		)
		.map((task) => state.patches[task.id] ?? task)
		.map((task) => ({ ...task, tags: task.tags.toSorted() }))

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
		const controller = new AbortController()

		addEventListener("keydown", (event) => {
			match(event)
				.with({ key: "ArrowDown", ctrlKey: true }, () => {
					moveFocus({ by: 1 })
				})
				.with({ key: "ArrowUp", ctrlKey: true }, () => {
					moveFocus({ by: -1 })
				})
				.with({ key: "Home", ctrlKey: true }, () => {
					moveFocus({ to: 0 })
				})
				.with({ key: "End", ctrlKey: true }, () => {
					moveFocus({ to: -1 })
				})
				.with({
					key: P.union("Enter", " "),
					ctrlKey: true,
					target: P.instanceOf(HTMLElement).and(
						P.shape({
							dataset: { taskId: P.string },
						}),
					),
				}, (event) => {
					event.preventDefault()
					const taskToUpdate = state.db.tasks.find((t) =>
						t.id === event.target.dataset.taskId
					)!
					dispatch({
						type: "taskChanged",
						task: { ...taskToUpdate, complete: !taskToUpdate.complete },
					})
				})
				.with({
					key: "Delete",
					ctrlKey: true,
					target: P.instanceOf(HTMLElement).and(
						P.shape({
							dataset: { taskId: P.string },
						}),
					),
				}, (event) => {
					event.preventDefault()
					dispatch({
						type: "taskRemoved",
						taskId: event.target.dataset.taskId,
					})
				})
				.otherwise(() => {})
		}, { signal: controller.signal })

		return () => {
			controller.abort()
		}
	})

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

	return (
		<div
			className="px-14 max-w-[720px] mx-auto w-full isolate pb-16"
			ref={containerRef}
		>
			<div className="sticky -mx-14 top-0 bg-primary-900 *:px-14 z-10 mb-1">
				<div className="relative flex overflow-clip pt-4 pb-3">
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
								const newTask = createTask(event.currentTarget.value)
								dispatch({ type: "taskAdded", task: newTask })
							}
						}}
					/>
					<Lucide.Loader2 className="self-center absolute right-0 h-full aspect-square animate-spin data-[pending]:opacity-50 opacity-0 transition-opacity" />
				</div>
				<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden mb-4">
					{[...state.tagFilter].map((tag) => (
						<li key={tag}>
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative focus-visible:outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
								onClick={() =>
									dispatch({ type: "tagFilterRemoved", tag })}
							>
								#{tag}
							</button>
						</li>
					))}
				</ul>
			</div>

			<ul className="flex flex-col gap-4">
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
