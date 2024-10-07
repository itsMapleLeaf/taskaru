import * as Lucide from "lucide-react"
import { matchSorter } from "match-sorter"
import { useTaskStoreContext } from "./store.tsx"
import { TaskCard } from "./TaskCard.tsx"

export function TaskListEditor() {
	const store = useTaskStoreContext()

	return (
		<div
			className="h-screen flex flex-col gap-4 py-4 px-14 max-w-[720px] mx-auto w-full"
			onKeyDown={(event) => {
				const moveFocus = (options: { to: number } | { by: number }) => {
					const focusItems = Array.from(
						event.currentTarget.querySelectorAll<HTMLElement>(
							"[data-focus-item]",
						),
					)
					const currentIndex = focusItems.findIndex(
						(element) => document.activeElement === element,
					)
					const nextIndex = "to" in options
						? options.to
						: mod(currentIndex + options.by, focusItems.length)
					const nextItem = focusItems.at(nextIndex)
					nextItem?.focus()
					nextItem?.scrollIntoView({
						behavior: "smooth",
						block: "center",
					})
				}

				if (event.key === "ArrowDown" && event.ctrlKey) {
					moveFocus({ by: 1 })
				}
				if (event.key === "ArrowUp" && event.ctrlKey) {
					moveFocus({ by: -1 })
				}
				if (event.key === "Home" && event.ctrlKey) {
					moveFocus({ to: 0 })
				}
				if (event.key === "End" && event.ctrlKey) {
					moveFocus({ to: -1 })
				}
				if (
					event.key === "Enter" &&
					event.ctrlKey &&
					event.target instanceof HTMLTextAreaElement &&
					event.target.dataset.taskId
				) {
					event.preventDefault()
					store.toggleTaskComplete(event.target.dataset.taskId)
				}
				if (
					event.key === "Delete" &&
					event.ctrlKey &&
					event.target instanceof HTMLTextAreaElement &&
					event.target.dataset.taskId
				) {
					event.preventDefault()
					moveFocus({ by: 1 })
					store.removeTask(event.target.dataset.taskId)
				}
			}}
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
				{matchSorter(store.tasks, store.input, {
					keys: ["text", "tags.*"],
				}).map((task) => (
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
