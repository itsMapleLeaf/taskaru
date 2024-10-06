import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { z } from "zod"
import { jsonSchema } from "../lib/json.ts"

export type Task = z.infer<typeof taskSchema>
export const taskSchema = z.object({
	id: z.string(),
	text: z.string(),
	tags: z.array(z.string()),
	complete: z.boolean(),
})

const taskDatabaseJsonSchema = jsonSchema.pipe(
	z.object({
		tasks: taskSchema.array(),
	}),
)

export const defaultTasks: Task[] = [
	{
		id: crypto.randomUUID(),
		text: "be nerd in school",
		tags: ["generic-protagonist", "glasses-push"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "get bullied",
		tags: ["cliche-backstory", "future-revenge"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "go home",
		tags: ["last-normal-moment", "family-dinner"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "leave house",
		tags: ["flag-raised", "death-flag"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "get hit by a bus",
		tags: ["truck-kun", "isekai-express"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "meet a god or goddess",
		tags: ["exposition-dump", "cheat-code"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "get sent to a parallel world",
		tags: ["new-life-who-dis", "medieval-fantasy"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "be overpowered",
		tags: ["mary-sue", "nerf-please"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "get all the boys/girls/whatever",
		tags: ["harem-time", "dense-protagonist"],
		complete: false,
	},
	{
		id: crypto.randomUUID(),
		text: "defeat the demon lord (it's always the demon lord)",
		tags: ["final-boss", "plot-twist-incoming"],
		complete: false,
	},
]

export async function loadTasks(filePath: string) {
	const content = await readTextFile(filePath)
	return taskDatabaseJsonSchema
		.catch(() => ({ tasks: defaultTasks }))
		.parse(content)
}

export function saveTasks(tasks: Task[], filePath: string) {
	writeTextFile(filePath, JSON.stringify({ tasks }))
}
