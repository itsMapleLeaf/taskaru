import * as Ariakit from "@ariakit/react"
import * as Lucide from "lucide-react"
import { useState } from "react"
import { card } from "./styles.ts"
import type { Task } from "./task-db.ts"

export function TaskCard({
	task,
	onCompleteChanged,
	onTagClicked,
}: {
	task: Task
	onCompleteChanged: (complete: boolean) => void
	onTagClicked: (tag: string) => void
}) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
	return (
		<>
			<div className="grid gap-2 grid-cols-[auto,1fr]">
				<button
					type="button"
					className="rounded-md p-1.5 hover:bg-primary-700 transition"
					role="checkbox"
					aria-checked={task.complete}
					onClick={() => onCompleteChanged(!task.complete)}
					onContextMenu={(event) => {
						event.preventDefault()
						setMenuOpen(true)
						setMenuPosition({
							x: event.clientX,
							y: event.clientY,
						})
					}}
				>
					{task.complete ? <Lucide.CheckSquare2 /> : <Lucide.Square />}
				</button>
				<textarea
					className="bg-primary-800 focus-visible:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg py-3 px-4 text-xl flex items-center w-full text-start has-[[aria-checked=true]]:opacity-50 transition relative hover:bg-primary-700 resize-none [field-sizing:content]"
					defaultValue={task.text}
				>
				</textarea>
				<ul className="flex items-center gap-3 flex-wrap leading-none empty:hidden col-start-2 -col-end-1">
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
			<Ariakit.MenuProvider open={menuOpen} setOpen={setMenuOpen}>
				<Ariakit.Menu
					getAnchorRect={() => menuPosition}
					className={card(
						"shadow-lg shadow-black/20 bg-primary-800 border border-primary-700 overflow-clip min-w-32 data-[enter]:scale-100 data-[enter]:opacity-100 opacity-0 scale-90 origin-[--popover-transform-origin] transition duration-100 ease-out data-[leave]:ease-in",
					)}
					portal
				>
					<Ariakit.MenuItem className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-700 transition">
						<Lucide.Trash className="size-5 -mx-0.5" />
						<span>Delete</span>
					</Ariakit.MenuItem>
				</Ariakit.Menu>
			</Ariakit.MenuProvider>
		</>
	)
}
