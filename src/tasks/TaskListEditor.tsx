import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { useEffect, useReducer, useRef } from "react"
import { match, P } from "ts-pattern"
import { clamp, ensure } from "../../lib/common.ts"
import type { TaskDb } from "./task-db.ts"
import { createTask, type Task } from "./task.ts"
import { TaskCard } from "./TaskCard.tsx"

function getFilteredTasks(
	tasks: readonly Task[],
	search: string,
	tags: ReadonlySet<string>,
) {
	let result = matchSorter(tasks, search, {
		keys: ["text", "tags.*"],
		sorter: (items) => {
			return items
				.sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt))
				.sort((a, b) => Number(b.rank) - Number(a.rank))
				.sort((a, b) => Number(a.item.complete) - Number(b.item.complete))
		},
	})

	if (tags.size > 0) {
		result = result.filter(
			(task) => task.tags.some((tag) => tags.has(tag)),
		)
	}

	return result.map((task) => ({ ...task, tags: task.tags.toSorted() }))
}

type State = {
	db: TaskDb
	search: string
	tagFilter: ReadonlySet<string>
	filteredTasks: Task[]
	save: boolean
}

type Action =
	| { type: "inputChanged"; input: string }
	| { type: "taskAdded"; task: Task }
	| { type: "tagClicked"; tag: string }
	| { type: "tagFilterRemoved"; tag: string }
	| { type: "taskChanged"; task: Task }
	| { type: "taskRemoved"; taskId: string }

function reducer(state: State, action: Action): State {
	if (action.type === "inputChanged") {
		return {
			...state,
			search: action.input,
			filteredTasks: getFilteredTasks(
				state.db.tasks,
				action.input,
				state.tagFilter,
			),
			save: false,
		}
	}
	if (action.type === "taskAdded") {
		const db = state.db.withNewTask(action.task)
		return {
			...state,
			search: "",
			db,
			filteredTasks: getFilteredTasks(db.tasks, "", state.tagFilter),
			save: true,
		}
	}
	if (action.type === "tagClicked") {
		const tagFilter = new Set([...state.tagFilter, action.tag])
		return {
			...state,
			tagFilter,
			filteredTasks: getFilteredTasks(
				state.db.tasks,
				state.search,
				tagFilter,
			),
			save: false,
		}
	}
	if (action.type === "tagFilterRemoved") {
		const tagFilter = new Set(state.tagFilter)
		tagFilter.delete(action.tag)
		return {
			...state,
			tagFilter,
			filteredTasks: getFilteredTasks(
				state.db.tasks,
				state.search,
				tagFilter,
			),
			save: false,
		}
	}
	if (action.type === "taskChanged") {
		const db = state.db.withUpdatedTask(action.task.id, () => action.task)
		return {
			...state,
			db,
			filteredTasks: state.filteredTasks.map((task) =>
				task.id === action.task.id ? action.task : task
			),
			save: true,
		}
	}
	if (action.type === "taskRemoved") {
		const db = state.db.withoutTask(action.taskId)
		return {
			...state,
			db,
			filteredTasks: state.filteredTasks.filter((task) =>
				task.id !== action.taskId
			),
			save: true,
		}
	}
	action satisfies never
	throw new Error(`unexpected action`, { cause: action })
}

export function TaskListEditor({ initialDb }: { initialDb: TaskDb }) {
	const [state, dispatch] = useReducer(reducer, {
		search: "",
		tagFilter: new Set<string>(),
		filteredTasks: getFilteredTasks(initialDb.tasks, "", new Set()),
		save: false,
		db: initialDb,
	})

	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (state.save) {
			state.db.save().catch((error) => {
				console.error("Failed to save DB:", error)
			})
		}
	}, [state.save, state.db])

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
				{state.filteredTasks.map((task) => (
					<li key={task.id}>
						<TaskCard
							task={task}
							onChange={(task) =>
								dispatch({ type: "taskChanged", task })}
							onRemove={(taskId) =>
								dispatch({ type: "taskRemoved", taskId })}
							onTagClick={(tag) => dispatch({ type: "tagClicked", tag })}
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
