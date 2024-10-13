import * as Lucide from "lucide-react"
import { ContextMenu } from "../ui/ContextMenu.tsx"
import { TagInput } from "./TagInput.tsx"
import type { Task } from "./task.ts"

export function TaskCard({
	task,
	onChange,
	onRemove,
	onTagClick,
}: {
	task: Task
	onChange: (task: Task) => void
	onRemove: (taskId: string) => void
	onTagClick: (tag: string) => void
}) {
	const update = (updates: Partial<Task>) => {
		onChange({ ...task, ...updates })
	}

	return (
		<ContextMenu>
			<ContextMenu.Trigger
				className="grid gap-2 data-[completed]:opacity-50 transition-opacity"
				data-completed={task.complete || undefined}
			>
				<div className="relative flex">
					<textarea
						className="textarea text-lg col-span-full"
						defaultValue={task.text}
						onChange={(event) => update({ text: event.target.value })}
						data-focus-item
						data-task-id={task.id}
					/>
					<div className="absolute left-full self-center p-2">
						<button
							type="button"
							className="button button-clear button-square self-center"
							role="checkbox"
							aria-checked={task.complete}
							onClick={() => update({ complete: !task.complete })}
						>
							{task.complete
								? <Lucide.CheckSquare />
								: <Lucide.Square />}
						</button>
					</div>
				</div>

				<ul className="flex items-center gap-2 flex-wrap leading-none empty:hidden col-start-2 -col-end-1">
					{task.tags.map((tag, index) => (
						<li key={index} className="flex gap-1 items-center">
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative rounded-sm leading-4"
								onClick={() => {
									onTagClick(tag)
								}}
							>
								#{tag}
							</button>
							<button
								type="button"
								className="button button-clear button-square h-5"
								onClick={() => {
									const newTags = task.tags.filter((t) =>
										t !== tag
									)
									update({ tags: newTags })
								}}
							>
								<Lucide.X className="size-3" />
							</button>
						</li>
					))}
					<li className="flex-1">
						<TagInput
							onAdd={(newTag) => {
								update({
									tags: [...task.tags, newTag],
								})
							}}
							onBackspace={() => {
								update({
									tags: task.tags.slice(0, -1),
								})
							}}
						/>
					</li>
				</ul>
			</ContextMenu.Trigger>

			<ContextMenu.Panel>
				<ContextMenu.Item
					icon={<Lucide.Trash />}
					onClick={() => onRemove(task.id)}
				>
					<span>Delete</span>
				</ContextMenu.Item>
			</ContextMenu.Panel>
		</ContextMenu>
	)
}
