import { z } from "zod"

export const jsonSchema = z.string()
	.transform((input) => JSON.parse(input))
