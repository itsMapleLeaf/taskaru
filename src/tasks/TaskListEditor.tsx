import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { useEffect, useRef, useState } from "react"
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

export function TaskListEditor({ db, onUpdateTasks }: {
	db: TaskDb
	onUpdateTasks: (tasks: readonly Task[]) => void
}) {
	const [search, setSearch] = useState("")
	const [tagFilter, setTagFilter] = useState<ReadonlySet<string>>(new Set())
	const [filteredTasks, setFilteredTasks] = useState<Task[]>(
		() => getFilteredTasks(db.tasks, search, tagFilter),
	)
	const containerRef = useRef<HTMLDivElement>(null)

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

	const handleInputChange = (
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		setSearch(event.target.value)
		setFilteredTasks(
			getFilteredTasks(db.tasks, event.target.value, tagFilter),
		)
	}

	const handleInputKeyDown = (
		event: React.KeyboardEvent<HTMLTextAreaElement>,
	) => {
		if (
			event.key === "Enter" && !event.shiftKey &&
			!event.ctrlKey
		) {
			event.preventDefault()
			const updated = db.withNewTask(
				createTask(event.currentTarget.value),
			)
			setSearch("")
			setFilteredTasks(
				getFilteredTasks(updated.tasks, "", tagFilter),
			)
			onUpdateTasks(updated.tasks)
		}
	}

	const handleTaskChange = (task: Task) => {
		const updated = db.withUpdatedTask(task.id, () => task)
		onUpdateTasks(updated.tasks)

		// instead of setting all of the filtered tasks,
		// only update the specific task that changed,
		// to keep the whole list from shifting when changing a single task
		setFilteredTasks((tasks) =>
			tasks.map((current) => current.id === task.id ? task : current)
		)
	}

	const handleTaskRemoved = (taskId: string) => {
		const updated = db.withoutTask(taskId)
		onUpdateTasks(updated.tasks)
		setFilteredTasks(getFilteredTasks(updated.tasks, search, tagFilter))
	}

	const handleTaskTagClicked = (tag: string) => {
		const newFilter = new Set([...tagFilter, tag])
		setTagFilter(newFilter)
		setFilteredTasks(getFilteredTasks(db.tasks, search, newFilter))
	}

	const handleTagFilterRemoved = (tag: string) => {
		const newFilter = new Set(tagFilter)
		newFilter.delete(tag)
		setTagFilter(newFilter)
		setFilteredTasks(getFilteredTasks(db.tasks, search, newFilter))
	}

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
					const updated = db.withUpdatedTask(
						event.target.dataset.taskId,
						(it) => ({ ...it, complete: !it.complete }),
					)
					onUpdateTasks(updated.tasks)

					// instead of setting all of the filtered tasks,
					// only update the specific task that changed,
					// to keep the whole list from shifting when changing a single task
					setFilteredTasks((tasks) =>
						tasks.map((it) =>
							it.id === event.target.dataset.taskId
								? ({ ...it, complete: !it.complete })
								: it
						)
					)
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
					const updated = db.withoutTask(event.target.dataset.taskId)
					onUpdateTasks(updated.tasks)
					setFilteredTasks(
						getFilteredTasks(updated.tasks, search, tagFilter),
					)
				})
				.otherwise(() => {})
		}, { signal: controller.signal })

		return () => {
			controller.abort()
		}
	})

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
						value={search}
						onChange={handleInputChange}
						onKeyDown={handleInputKeyDown}
					/>
					<Lucide.Loader2 className="self-center absolute right-0 h-full aspect-square animate-spin data-[pending]:opacity-50 opacity-0 transition-opacity" />
				</div>
				<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden mb-4">
					{[...tagFilter].map((tag) => (
						<li key={tag}>
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative focus-visible:outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
								onClick={() => handleTagFilterRemoved(tag)}
							>
								#{tag}
							</button>
						</li>
					))}
				</ul>
			</div>

			<ul className="flex flex-col gap-4">
				{filteredTasks.map((task) => (
					<li key={task.id}>
						<TaskCard
							task={task}
							onChange={handleTaskChange}
							onRemove={handleTaskRemoved}
							onTagClick={handleTaskTagClicked}
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
