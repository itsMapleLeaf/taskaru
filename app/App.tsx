import { Check } from "lucide-react"
import { useState } from "react"

const tasks = [
	"be nerd in school",
	"get bullied",
	"go home",
	"leave house",
	"get hit by a bus",
	"meet a god or goddess",
	"get sent to a parallel world",
	"be overpowered",
	"get all the boys/girls/whatever",
	"defeat the demon lord (it's always the demon lord)",
]

export function App() {
	return (
		<div className="h-screen flex flex-col gap-3 p-4 max-w-screen-sm mx-auto w-full">
			<input
				className="bg-primary-800 focus:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg h-14 px-4 text-xl"
				placeholder="What's next?"
			/>
			<ul className="flex flex-col gap-[inherit] flex-1 min-h-0 overflow-y-auto -mx-4 px-4 -my-2 py-2">
				{tasks.map((task, index) => (
					<li key={index}>
						<Task text={task} />
					</li>
				))}
			</ul>
		</div>
	)
}

function Task({ text }: { text: string }) {
	const [complete, setComplete] = useState(false)
	const tags = ["mvp", "frontend", "internal"]
	return (
		<article className="bg-primary-800 focus-visible:outline outline-2 outline-primary-600 outline-offset-2 rounded-lg py-3 px-4 text-xl flex items-center w-full text-start has-[[aria-checked=true]]:opacity-50 transition relative hover:bg-primary-700">
			<button
				type="button"
				className="absolute inset-0 focus-visible:outline outline-2 outline-primary-600 outline-offset-2"
				role="checkbox"
				aria-checked={complete}
				onClick={() => setComplete(!complete)}
			>
			</button>
			<div className="flex flex-col gap-1 flex-1">
				<h2>{text}</h2>
				<ul className="flex items-center gap-3 flex-wrap leading-none">
					{tags.map((tag, index) => (
						<li key={index}>
							<button
								type="button"
								className="text-sm text-primary-300 hover:underline relative"
							>
								#{tag}
							</button>
						</li>
					))}
				</ul>
			</div>
			{complete ? <Check aria-label="Completed" /> : null}
		</article>
	)
}
