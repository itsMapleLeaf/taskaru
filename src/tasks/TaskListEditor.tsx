import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { useState, useTransition } from "react"
import { match, P } from "ts-pattern"
import { clamp } from "../../lib/common.ts"
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
	const [pending, startTransition] = useTransition()

	const moveFocus = (
		event: React.KeyboardEvent<HTMLDivElement>,
		options: { to: number } | { by: number } | { byClamped: number },
	) => {
		const focusItems = Array.from(
			event.currentTarget.querySelectorAll<HTMLElement>(
				"[data-focus-item]",
			),
		)
		const currentIndex = focusItems.findIndex(
			(element) => document.activeElement === element,
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

		const nextItem = focusItems.at(nextIndex)
		nextItem?.focus()
		nextItem?.scrollIntoView({
			behavior: "smooth",
			block: nextIndex === 0 ? "start" : "center",
		})
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

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		match(event)
			.with({ key: "ArrowDown", ctrlKey: true }, () => {
				moveFocus(event, { by: 1 })
			})
			.with({ key: "ArrowUp", ctrlKey: true }, () => {
				moveFocus(event, { by: -1 })
			})
			.with({ key: "Home", ctrlKey: true }, () => {
				moveFocus(event, { to: 0 })
			})
			.with({ key: "End", ctrlKey: true }, () => {
				moveFocus(event, { to: -1 })
			})
			.with({
				key: "Enter",
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
				setFilteredTasks(getFilteredTasks(updated.tasks, search, tagFilter))
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
				setFilteredTasks(getFilteredTasks(updated.tasks, search, tagFilter))
			})
			.otherwise(() => {})
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
		const newFilter = new Set([tag])
		setTagFilter(newFilter)
		setFilteredTasks(getFilteredTasks(db.tasks, search, newFilter))
	}

	const handleTagUnfiltered = (tag: string) => {
		const newFilter = new Set(tagFilter)
		newFilter.delete(tag)
		setTagFilter(newFilter)
		setFilteredTasks(getFilteredTasks(db.tasks, search, newFilter))
	}

	return (
		<div
			className="px-14 max-w-[720px] mx-auto w-full isolate pb-16"
			onKeyDown={handleKeyDown}
		>
			<div className="sticky -mx-14 top-0 bg-primary-900 z-10 mb-2">
				<div className="relative flex overflow-clip px-14 px-4 pt-4 pb-2">
					<textarea
						className="textarea text-lg"
						rows={1}
						placeholder="What's next?"
						data-focus-item
						value={search}
						onChange={handleInputChange}
						onKeyDown={handleInputKeyDown}
					/>
					<Lucide.Loader2
						data-pending={pending || undefined}
						className="self-center absolute right-0 h-full aspect-square animate-spin data-[pending]:opacity-50 opacity-0 transition-opacity"
					/>
				</div>
			</div>

			<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden">
				{[...tagFilter].map((tag) => (
					<li key={tag}>
						<button
							type="button"
							className="text-sm text-primary-300 hover:underline relative focus-visible:outline outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
							onClick={() => handleTagUnfiltered(tag)}
						>
							#{tag}
						</button>
					</li>
				))}
			</ul>

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
