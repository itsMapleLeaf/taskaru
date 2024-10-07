import "@fontsource-variable/rubik/index.css"
import "./main.css"

import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"

createRoot(document.querySelector("#root") as HTMLElement).render(<App />)
