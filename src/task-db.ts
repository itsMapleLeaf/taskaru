import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { z } from "zod"
import { jsonSchema } from "../lib/json.ts"
import { type Task, taskSchema } from "./task.ts"

export const DEFAULT_TASKS: readonly Task[] = [
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

type SerializedTaskDb = z.input<typeof serializedTaskDbSchema>
const serializedTaskDbSchema = z.object({
	tasks: z.array(taskSchema).readonly(),
}).catch({
	tasks: DEFAULT_TASKS,
})

export class TaskDb {
	constructor(
		readonly tasks: readonly Task[],
		readonly file: string,
	) {}

	static async fromFile(file: string) {
		if (!await exists(file)) {
			throw new Error(`TaskDb file not found: ${file}`)
		}

		const content = await readTextFile(file)
		const loaded = jsonSchema.pipe(serializedTaskDbSchema).parse(content)
		return new TaskDb(loaded.tasks, file)
	}

	async save() {
		const data: SerializedTaskDb = { tasks: this.tasks }
		await writeTextFile(
			this.file,
			JSON.stringify(data, null, "\t"),
		)
	}

	withTasks(tasks: readonly Task[]) {
		return new TaskDb(tasks, this.file)
	}

	withNewTask(task: Task) {
		return this.withTasks([task, ...this.tasks])
	}

	withoutTask(id: string) {
		return this.withTasks(this.tasks.filter((t) => t.id !== id))
	}

	withUpdatedTask(id: string, next: (current: Task) => Task) {
		return this.withTasks(
			this.tasks.map((it) => (it.id === id ? next(it) : it)),
		)
	}
}
