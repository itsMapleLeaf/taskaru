import * as Ariakit from "@ariakit/react"
import { type ComponentProps, type ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export function Menu(props: Ariakit.MenuProviderProps) {
	return <Ariakit.MenuProvider {...props} />
}

Menu.Button = Ariakit.MenuButton

Menu.Separator = MenuSeparator
function MenuSeparator(
	{ className, ...props }: ComponentProps<typeof Ariakit.MenuSeparator>,
) {
	return (
		<Ariakit.MenuSeparator
			{...props}
			className={twMerge("border-primary-700 mx-1", className)}
		/>
	)
}

Menu.Panel = MenuPanel
function MenuPanel(props: ComponentProps<typeof Ariakit.Menu>) {
	return (
		<Ariakit.Menu
			portal
			unmountOnHide
			gutter={8}
			{...props}
			className={twMerge("menu-panel", props.className)}
		/>
	)
}

Menu.Item = MenuItem
function MenuItem(
	{ children, className, icon, ...props }:
		& ComponentProps<typeof Ariakit.MenuItem>
		& { icon?: ReactNode },
) {
	return (
		<Ariakit.MenuItem
			{...props}
			className={twMerge("menu-item", className)}
		>
			<span className="size-5 -mx-1 *:size-full">{icon}</span>
			<span>{children}</span>
		</Ariakit.MenuItem>
	)
}
