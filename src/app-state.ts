import * as path from "@tauri-apps/api/path"
import * as fs from "@tauri-apps/plugin-fs"
import { type } from "arktype"

type AppState = typeof AppState.infer
const AppState = type({
	lastFile: type("string | null").default(null),
}).default(() => ({
	lastFile: null,
}))

let state: AppState = {
	lastFile: null,
}

async function getStateFile() {
	return await path.resolve(await path.appDataDir(), "state.json")
}

export async function loadAppState() {
	try {
		const stateFile = await getStateFile()

		const exists = await fs.exists(stateFile)
		if (!exists) return state

		const content = await fs.readTextFile(stateFile)
		return state = AppState.assert(JSON.parse(content))
	} catch (error) {
		console.error(error)
		return state
	}
}

export function getAppState() {
	return state
}

export async function updateAppState(patch: Partial<AppState>) {
	const stateFile = await getStateFile()
	await fs.writeTextFile(stateFile, JSON.stringify({ ...state, ...patch }))
}
