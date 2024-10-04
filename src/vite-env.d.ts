/// <reference types="vite/client" />

declare module "react" {
	// @ts-types="@types/react"
	import React from "npm:react"
	// @ts-expect-error: necessary workaround to get types
	export = React
}
declare module "react-dom" {
	// @ts-types="@types/react-dom"
	import ReactDOM from "npm:react-dom"
	// @ts-expect-error: necessary workaround to get types
	export = ReactDOM
}
