import { invoke } from "@tauri-apps/api/core"
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { z } from "zod"
import { jsonSchema } from "../lib/json.ts"

export type Task = z.output<typeof taskSchema>
const taskSchema = z.object({
	id: z.string(),
	text: z.string(),
	tags: z.array(z.string()).readonly(),
	complete: z.boolean(),
})

export type TaskDb = {
	readonly tasks: readonly Task[]
	readonly file: string
}

const defaultTasks: readonly Task[] = [
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

const serializedTaskDbSchema = z.object({
	tasks: z.array(taskSchema).readonly(),
}).catch({
	tasks: defaultTasks,
})

export function createTaskDb(tasks: readonly Task[], file: string): TaskDb {
	return { tasks, file }
}

export function setTasks(db: TaskDb, tasks: readonly Task[]): TaskDb {
	return { ...db, tasks }
}

export async function loadTaskDb(file: string): Promise<TaskDb> {
	let db
	if (await exists(file)) {
		const content = await readTextFile(file)
		const loaded = jsonSchema.pipe(serializedTaskDbSchema).safeParse(content)
		if (loaded.success) {
			db = createTaskDb(loaded.data.tasks, file)
		} else {
			console.warn("failed to load task db:", loaded.error)
			db = createTaskDb(defaultTasks, file)
		}
	} else {
		db = createTaskDb(defaultTasks, file)
		await saveTaskDb(db)
	}
	localStorage.setItem("lastFilePath", db.file)

	// we need to add the path to the app's fs scope
	// so that it gets persisted by the persisted-scope plugin
	// and we can use it on app restart
	await invoke("add_path_to_fs_scope", { path: file })

	return db
}

export async function saveTaskDb(db: TaskDb) {
	await writeTextFile(
		db.file,
		JSON.stringify({ tasks: db.tasks }, null, "\t"),
	)
}

export async function loadRecentTaskDb() {
	const file = localStorage.getItem("lastFilePath")
	if (!file) return null

	return await loadTaskDb(file)
}
