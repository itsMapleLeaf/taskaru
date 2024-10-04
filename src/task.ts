import { z } from "zod"
import { jsonSchema } from "../lib/json.ts"

export type Task = z.infer<typeof taskSchema>
export const taskSchema = z.object({
	text: z.string(),
	tags: z.array(z.string()),
	complete: z.boolean(),
})

const defaultTasks: Task[] = [
	{
		text: "be nerd in school",
		tags: ["generic-protagonist", "glasses-push"],
		complete: false,
	},
	{
		text: "get bullied",
		tags: ["cliche-backstory", "future-revenge"],
		complete: false,
	},
	{
		text: "go home",
		tags: ["last-normal-moment", "family-dinner"],
		complete: false,
	},
	{
		text: "leave house",
		tags: ["flag-raised", "death-flag"],
		complete: false,
	},
	{
		text: "get hit by a bus",
		tags: ["truck-kun", "isekai-express"],
		complete: false,
	},
	{
		text: "meet a god or goddess",
		tags: ["exposition-dump", "cheat-code"],
		complete: false,
	},
	{
		text: "get sent to a parallel world",
		tags: ["new-life-who-dis", "medieval-fantasy"],
		complete: false,
	},
	{
		text: "be overpowered",
		tags: ["mary-sue", "nerf-please"],
		complete: false,
	},
	{
		text: "get all the boys/girls/whatever",
		tags: ["harem-time", "dense-protagonist"],
		complete: false,
	},
	{
		text: "defeat the demon lord (it's always the demon lord)",
		tags: ["final-boss", "plot-twist-incoming"],
		complete: false,
	},
]

export function loadTasks() {
	return jsonSchema
		.pipe(taskSchema.array())
		.catch(() => defaultTasks)
		.parse(localStorage.getItem("tasks"))
}

export function saveTasks(tasks: Task[]) {
	localStorage.setItem("tasks", JSON.stringify(tasks))
}
