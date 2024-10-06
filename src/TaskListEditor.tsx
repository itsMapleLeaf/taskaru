import { useState } from "react"
import { createTask, Task } from "./task-db.ts"
import { TaskCard } from "./TaskCard.tsx"

export function TaskListEditor({
	tasks,
	setTasks,
}: {
	tasks: readonly Task[]
	setTasks: (tasks: readonly Task[]) => void
}) {
	const [input, setInput] = useState("")
	const [tagFilter, setTagFilter] = useState(new Set<string>())

	return (
		<div className="h-screen flex flex-col gap-4 p-4 max-w-screen-sm mx-auto w-full">
			<textarea
				className="bg-primary-800 focus:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg py-3 px-4 text-xl [field-sizing:content] resize-none"
				rows={1}
				placeholder="What's next?"
				value={input}
				onChange={(event) => setInput(event.target.value)}
				onKeyDown={(event) => {
					if (
						event.key === "Enter" &&
						(event.shiftKey || event.ctrlKey)
					) {
						event.preventDefault()
						setTasks([createTask(input), ...tasks])
						setInput("")
					}
				}}
			/>

			<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden">
				{[...tagFilter].map((tag, index) => (
					<li key={index}>
						<button
							type="button"
							className="text-sm text-primary-300 hover:underline relative focus-visible:outline outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
							onClick={() => setTagFilter(new Set([]))}
						>
							#{tag}
						</button>
					</li>
				))}
			</ul>

			<ul className="flex flex-col gap-4 -mr-4 ml-[-60px] -my-2 py-2 pl-4 pr-2 flex-1 min-h-0 overflow-y-scroll">
				{tasks
					.filter((task) =>
						!tagFilter.size || task.tags.some((tag) => tagFilter.has(tag))
					)
					.map((task, index) => (
						<li key={index}>
							<TaskCard
								task={task}
								onCompleteChanged={(complete) => {
									setTasks(
										tasks.map((t, i) =>
											i === index ? { ...t, complete } : t
										),
									)
								}}
								onTagClicked={(tag) => {
									setTagFilter(new Set([tag]))
								}}
							/>
						</li>
					))}
			</ul>
		</div>
	)
}
