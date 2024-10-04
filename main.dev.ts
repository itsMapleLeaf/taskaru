import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts"

console.log(globalThis.location)

const app = new WebUI()

// set a stable port so our template can find the webui script
if (!app.setPort(8888)) {
	console.log("%c[webui] Port 8888 is already in use.", "color: yellow")
}

console.log("%c[webui] Opening window...", "color: gray")
await app.show("http://localhost:5173/")
console.log("%c[webui] Window opened", "color: green")

await WebUI.wait()

console.log("%c[webui] Shutting down...", "color: gray")
