import { LucideLoader2 } from "lucide-react"
import { type ComponentProps } from "react"
import { twMerge } from "tailwind-merge"

export function LoadingIcon(props: ComponentProps<typeof LucideLoader2>) {
	return (
		<LucideLoader2
			{...props}
			className={twMerge(`animate-spin`, props.className)}
		/>
	)
}
