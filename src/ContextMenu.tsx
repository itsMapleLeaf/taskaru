import * as Ariakit from "@ariakit/react"
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	use,
	useState,
} from "react"
import { twMerge } from "tailwind-merge"
import { card } from "./styles.ts"

const ContextMenuContext = createContext({
	menuOpen: false,
	setMenuOpen: (_open: boolean) => {},
	menuPosition: { x: 0, y: 0 },
	setMenuPosition: (_position: { x: number; y: number }) => {},
})

export function ContextMenuProvider({
	children,
}: { children: React.ReactNode }) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
	return (
		<Ariakit.MenuProvider open={menuOpen} setOpen={setMenuOpen}>
			<ContextMenuContext
				value={{ menuOpen, setMenuOpen, menuPosition, setMenuPosition }}
			>
				{children}
			</ContextMenuContext>
		</Ariakit.MenuProvider>
	)
}

export function ContextMenuTrigger(props: ComponentProps<"div">) {
	const context = use(ContextMenuContext)
	return (
		<div
			{...props}
			onContextMenu={(event) => {
				props.onContextMenu?.(event)
				if (event.defaultPrevented) {
					return
				}
				event.preventDefault()
				context.setMenuOpen(true)
				context.setMenuPosition({
					x: event.clientX,
					y: event.clientY,
				})
			}}
		/>
	)
}

export function ContextMenuPanel(props: ComponentProps<typeof Ariakit.Menu>) {
	const context = use(ContextMenuContext)
	return (
		<Ariakit.Menu
			getAnchorRect={() => context.menuPosition}
			portal
			unmountOnHide
			{...props}
			className={card(
				"shadow-lg shadow-black/20 bg-primary-800 border border-primary-700 overflow-clip min-w-32 data-[enter]:scale-100 data-[enter]:opacity-100 opacity-0 scale-90 origin-[--popover-transform-origin] transition duration-100 ease-out data-[leave]:ease-in",
				props.className,
			)}
		/>
	)
}

export function ContextMenuItem(
	{ children, className, icon, ...props }:
		& ComponentProps<typeof Ariakit.MenuItem>
		& { icon?: ReactNode },
) {
	return (
		<Ariakit.MenuItem
			{...props}
			className={twMerge(
				"flex items-center gap-2.5 px-3 py-2 hover:bg-primary-700 transition",
				className,
			)}
		>
			<span className="size-5 -mx-0.5 *:size-full">{icon}</span>
			<span>{children}</span>
		</Ariakit.MenuItem>
	)
}
