import { z } from "zod"

export type Task = z.output<typeof taskSchema>
export const taskSchema = z.object({
	id: z.string(),
	text: z.string(),
	tags: z.array(z.string()).readonly(),
	complete: z.boolean(),
})

export function createTask(text: string, tags?: readonly string[]): Task {
	return {
		id: crypto.randomUUID(),
		text,
		tags: tags ?? [],
		complete: false,
	}
}
