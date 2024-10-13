import * as tauriDialog from "@tauri-apps/plugin-dialog"
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { z } from "zod"
import { jsonSchema } from "../../lib/json.ts"
import { updateAppState } from "../app-state.ts"
import { type Task, taskSchema } from "./task.ts"

type SerializedTaskDb = z.input<typeof serializedTaskDbSchema>
const serializedTaskDbSchema = z.object({
	tasks: z.array(taskSchema).readonly(),
}).catch({
	tasks: [],
})

export class TaskDb {
	constructor(readonly tasks: readonly Task[], readonly file: string) {}

	static async fromFile(file: string) {
		if (!await exists(file)) {
			throw new Error(`TaskDb file not found: ${file}`)
		}

		const content = await readTextFile(file)
		const loaded = jsonSchema.pipe(serializedTaskDbSchema).parse(content)
		return new TaskDb(loaded.tasks, file)
	}

	static async openWithFilePicker(): Promise<TaskDb | null> {
		const file = await tauriDialog.open({
			filters: [{ name: "JSON", extensions: ["json"] }],
		})

		if (!file) return null
		if (!(await exists(file))) return null

		const db = await TaskDb.fromFile(file)
		updateAppState({ lastFile: db.file })
		return db
	}

	static async saveWithFilePicker(db: TaskDb): Promise<TaskDb | null> {
		const file = await tauriDialog.save({
			defaultPath: "tasks.json",
			filters: [{ name: "JSON", extensions: ["json"] }],
		})

		if (!file) return null

		const newDb = new TaskDb(db.tasks, file)
		await newDb.save()
		updateAppState({ lastFile: newDb.file })
		return newDb
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
