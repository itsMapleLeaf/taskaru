import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { match, P } from "ts-pattern"
import { clamp } from "../../lib/common.ts"
import { useTaskStoreContext } from "./store.tsx"
import { TaskCard } from "./TaskCard.tsx"

export function TaskListEditor() {
	const store = useTaskStoreContext()

	const filteredTasks = matchSorter(
		store.tasks.map((it) => ({
			...it,
			tags: it.tags.toSorted(),
		})),
		store.input,
		{
			keys: ["text", "tags.*"],
			baseSort: (a, b) => b.item.createdAt.localeCompare(a.item.createdAt),
		},
	)

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
			block: "center",
		})
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
				store.toggleTaskComplete(event.target.dataset.taskId)
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
				moveFocus(event, { byClamped: 1 })
				store.removeTask(event.target.dataset.taskId)
			})
			.otherwise(() => {})
	}

	return (
		<div
			className="h-screen flex flex-col gap-4 py-4 px-14 max-w-[720px] mx-auto w-full"
			onKeyDown={handleKeyDown}
		>
			<div className="relative flex">
				<textarea
					className="textarea text-lg"
					rows={1}
					placeholder="What's next?"
					value={store.input}
					data-focus-item
					onChange={(event) => store.setInput(event.target.value)}
					onKeyDown={(event) => {
						if (
							event.key === "Enter" &&
							(event.shiftKey || event.ctrlKey)
						) {
							event.preventDefault()
							store.addTask(store.input)
							store.setInput("")
						}
					}}
				/>
				<Lucide.Loader2
					data-pending={store.pending || undefined}
					className="self-center absolute right-0 h-full aspect-square animate-spin data-[pending]:opacity-50 opacity-0 transition-opacity"
				/>
			</div>

			<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden">
				{[...store.tagFilter].map((tag) => (
					<li key={tag}>
						<button
							type="button"
							className="text-sm text-primary-300 hover:underline relative focus-visible:outline outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
							onClick={() => store.setTagFilter(new Set([]))}
						>
							#{tag}
						</button>
					</li>
				))}
			</ul>

			<ul className="flex flex-col gap-4 -ml-16 -mr-4 -my-2 py-2 pl-4 pr-2 flex-1 min-h-0 overflow-y-scroll">
				{filteredTasks.map((task) => (
					<li key={task.id}>
						<TaskCard task={task} />
					</li>
				))}
			</ul>
		</div>
	)
}

function mod(a: number, b: number) {
	return ((a % b) + b) % b
}
