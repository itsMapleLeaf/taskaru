import * as Lucide from "lucide-react"
import { ContextMenu } from "../ui/ContextMenu.tsx"
import { useTaskStoreContext } from "./store.tsx"
import type { Task } from "./task.ts"

export function TaskCard({ task }: { task: Task }) {
	const store = useTaskStoreContext()
	return (
		<ContextMenu>
			<ContextMenu.Trigger
				className="grid gap-2 grid-cols-[auto,1fr] data-[completed]:opacity-50 transition-opacity"
				data-completed={task.complete || undefined}
			>
				<button
					type="button"
					className="rounded-md size-10 grid place-content-center hover:bg-primary-700 transition self-center"
					role="checkbox"
					aria-checked={task.complete}
					onClick={() => store.setTaskComplete(task.id, !task.complete)}
				>
					{task.complete ? <Lucide.CheckSquare /> : <Lucide.Square />}
				</button>

				<textarea
					className="bg-primary-800 focus-visible:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg py-3 px-4 text-xl flex items-center w-full text-start has-[[aria-checked=true]]:opacity-50 transition relative hover:bg-primary-700 resize-none [field-sizing:content]"
					defaultValue={task.text}
					onChange={(event) =>
						store.setTaskText(task.id, event.target.value)}
					data-focus-item
					data-task-id={task.id}
				/>

				<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden col-start-2 -col-end-1">
					{task.tags.map((tag, index) => (
						<li key={index}>
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative focus-visible:outline outline-2 outline-offset-2 outline-primary-600 rounded leading-4"
								onClick={() => store.setTagFilter(new Set([tag]))}
							>
								#{tag}
							</button>
						</li>
					))}
				</ul>
			</ContextMenu.Trigger>

			<ContextMenu.Panel>
				<ContextMenu.Item
					icon={<Lucide.Trash />}
					onClick={() => store.removeTask(task.id)}
				>
					<span>Delete</span>
				</ContextMenu.Item>
			</ContextMenu.Panel>
		</ContextMenu>
	)
}
