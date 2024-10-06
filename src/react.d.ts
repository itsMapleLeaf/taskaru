declare module "react" {
	// @ts-types="@types/react"
	import React from "npm:react"
	// @ts-expect-error: necessary workaround to get types
	export = React
}

declare module "react-dom" {
	// @ts-types="npm:@types/react-dom"
	import ReactDOM from "npm:react-dom"
	// @ts-expect-error: necessary workaround to get types
	export = ReactDOM
}

declare module "react-dom/client" {
	// @ts-types="npm:@types/react-dom/client"
	import ReactDOM from "npm:react-dom/client"
	// @ts-expect-error: necessary workaround to get types
	export = ReactDOM
}
