import * as Lucide from "lucide-react"
import { ContextMenu } from "../ui/ContextMenu.tsx"
import { useTaskStoreContext } from "./store.tsx"
import type { Task } from "./task.ts"

export function TaskCard({ task }: { task: Task }) {
	const store = useTaskStoreContext()
	return (
		<ContextMenu>
			<ContextMenu.Trigger
				className="grid gap-2 grid-cols-[auto_1fr] data-[completed]:opacity-50 transition-opacity"
				data-completed={task.complete || undefined}
			>
				<button
					type="button"
					className="button button-clear button-square self-center"
					role="checkbox"
					aria-checked={task.complete}
					onClick={() => store.setTaskComplete(task.id, !task.complete)}
				>
					{task.complete ? <Lucide.CheckSquare /> : <Lucide.Square />}
				</button>

				<textarea
					className="textarea text-lg"
					defaultValue={task.text}
					onChange={(event) =>
						store.setTaskText(task.id, event.target.value)}
					data-focus-item
					data-task-id={task.id}
				/>

				<ul className="flex items-center gap-2 flex-wrap leading-none empty:hidden col-start-2 -col-end-1">
					{task.tags.map((tag, index) => (
						<li key={index} className="flex gap-1 items-center">
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative rounded-sm leading-4"
								onClick={() =>
									store.setTagFilter(new Set([tag]))}
							>
								#{tag}
							</button>
							<button
								type="button"
								className="button button-clear button-square h-5"
								onClick={() =>
									store.removeTaskTag(task.id, tag)}
							>
								<Lucide.X className="size-3" />
							</button>
						</li>
					))}
					<li className="flex-1">
						<input
							className="text-sm text-primary-300 relative rounded-sm border-0 leading-4 w-full min-w-[100px]"
							placeholder="Add tag..."
							data-focus-item
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									store.addTaskTag(task.id, event.currentTarget.value)
									event.currentTarget.value = ""
								}
							}}
						/>
					</li>
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
