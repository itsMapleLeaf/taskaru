import * as Ariakit from "@ariakit/react"
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	use,
	useState,
} from "react"
import { twMerge } from "tailwind-merge"

const ContextMenuContext = createContext({
	menuOpen: false,
	setMenuOpen: (_open: boolean) => {},
	menuPosition: { x: 0, y: 0 },
	setMenuPosition: (_position: { x: number; y: number }) => {},
})

export function ContextMenu({
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

ContextMenu.Trigger = ContextMenuTrigger
function ContextMenuTrigger(props: ComponentProps<"div">) {
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

ContextMenu.Panel = ContextMenuPanel
function ContextMenuPanel(props: ComponentProps<typeof Ariakit.Menu>) {
	const context = use(ContextMenuContext)
	return (
		<Ariakit.Menu
			getAnchorRect={() => context.menuPosition}
			portal
			unmountOnHide
			{...props}
			className={twMerge("menu-panel", props.className)}
		/>
	)
}

ContextMenu.Item = ContextMenuItem
function ContextMenuItem(
	{ children, className, icon, ...props }:
		& ComponentProps<typeof Ariakit.MenuItem>
		& { icon?: ReactNode },
) {
	return (
		<Ariakit.MenuItem
			{...props}
			className={twMerge("menu-item", className)}
		>
			<span className="size-5 -mx-0.5 *:size-full">{icon}</span>
			<span>{children}</span>
		</Ariakit.MenuItem>
	)
}
