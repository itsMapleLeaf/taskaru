import { open } from "@tauri-apps/plugin-dialog"
import { exists } from "@tauri-apps/plugin-fs"
import { Check } from "lucide-react"
import { useRef, useState } from "react"
import { defaultTasks, loadTasks, saveTasks, type Task } from "./task.ts"

const lastFilePath = localStorage.getItem("lastFilePath")
const initialTasks = lastFilePath ? await loadTasks(lastFilePath) : null

export function App() {
	const [tasks, setTasks] = useState(initialTasks?.tasks)
	const filepathRef = useRef(lastFilePath)

	return tasks
		? (
			<TaskEditor
				tasks={tasks}
				setTasks={(tasks) => {
					setTasks(tasks)
					saveTasks(tasks, filepathRef.current!)
				}}
			/>
		)
		: (
			<main className="absolute inset-0 flex flex-col items-center gap-4">
				<p>Choose a location to save your tasks.</p>
				<button
					type="button"
					className="bg-primary-800 focus:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg h-14 px-4 text-xl"
					onClick={async () => {
						const filePath = await open({
							directory: false,
							multiple: false,
						})
						if (!filePath) return

						if (!await exists(filePath)) {
							saveTasks(defaultTasks, filePath)
							setTasks(defaultTasks)
						} else {
							const data = await loadTasks(filePath)
							setTasks(data.tasks)
						}

						filepathRef.current = filePath
						localStorage.setItem("lastFilePath", filePath)
					}}
				>
					Choose location
				</button>
			</main>
		)
}

function TaskEditor({
	tasks,
	setTasks,
}: {
	tasks: Task[]
	setTasks: (tasks: Task[]) => void
}) {
	const [tagFilter, setTagFilter] = useState(new Set<string>())

	return (
		<div className="h-screen flex flex-col gap-2 p-4 max-w-screen-sm mx-auto w-full">
			<input
				className="bg-primary-800 focus:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg h-14 px-4 text-xl"
				placeholder="What's next?"
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
			<ul className="flex flex-col gap-2 -mx-4 pl-4 pr-2 flex-1 min-h-0 overflow-y-scroll">
				{tasks
					.filter((task) =>
						!tagFilter.size || task.tags.some((tag) => tagFilter.has(tag))
					)
					.map((task, index) => (
						<li key={index}>
							<Task
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

function Task(
	{ task, onCompleteChanged, onTagClicked }: {
		task: Task
		onCompleteChanged: (complete: boolean) => void
		onTagClicked: (tag: string) => void
	},
) {
	return (
		<article className="bg-primary-800 focus-visible:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg py-3 px-4 text-xl flex items-center w-full text-start has-[[aria-checked=true]]:opacity-50 transition relative hover:bg-primary-700">
			<button
				type="button"
				className="absolute inset-0 focus-visible:outline outline-2 outline-primary-600 outline-offset-2 rounded-[inherit]"
				role="checkbox"
				aria-checked={task.complete}
				onClick={() => onCompleteChanged(!task.complete)}
			>
			</button>
			<div className="flex flex-col gap-1 flex-1">
				<h2>{task.text}</h2>
				<ul className="flex items-center gap-3 flex-wrap leading-none">
					{task.tags.map((tag, index) => (
						<li key={index}>
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative focus-visible:outline outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
								onClick={() => onTagClicked(tag)}
							>
								#{tag}
							</button>
						</li>
					))}
				</ul>
			</div>
			{task.complete ? <Check aria-label="Completed" /> : null}
		</article>
	)
}
