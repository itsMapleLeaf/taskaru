import * as Lucide from "lucide-react"
import { useTaskStoreContext } from "./store.tsx"
import { TaskCard } from "./TaskCard.tsx"

export function TaskListEditor() {
	const store = useTaskStoreContext()

	return (
		<div className="h-screen flex flex-col gap-4 py-4 px-14 max-w-screen-md mx-auto w-full">
			<div className="relative flex">
				<textarea
					className="bg-primary-800 focus:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg py-3 px-4 text-xl [field-sizing:content] resize-none w-full"
					rows={1}
					placeholder="What's next?"
					value={store.input}
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
				{store.tasks
					.filter((task) =>
						!store.tagFilter.size || task.tags.some((tag) =>
							store.tagFilter.has(tag)
						)
					)
					.map((task) => (
						<li key={task.id}>
							<TaskCard task={task} />
						</li>
					))}
			</ul>
		</div>
	)
}
