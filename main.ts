import { join } from "https://deno.land/std/path/mod.ts"
import { WebUI } from "https://deno.land/x/webui@2.4.4/mod.ts"

const app = new WebUI()

app.setPort(8888)

app.setRootFolder(
	await Deno.realPath(join(Deno.cwd(), "dist")),
)

console.log("%c[webui] Opening window...", "color: gray")
await app.show("index.html")
console.log("%c[webui] Window opened", "color: green")

await WebUI.wait()

console.log("%c[webui] Shutting down...", "color: gray")
