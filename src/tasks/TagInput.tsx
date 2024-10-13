import * as Ariakit from "@ariakit/react"
import { matchSorter } from "match-sorter"
import { useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import { ensure } from "../../lib/common.ts"

interface TagInputProps {
	onAdd: (tag: string) => void
	onBackspace: () => void
	placeholder?: string
	options: ReadonlySet<string>
}

export function TagInput(
	{ onAdd, onBackspace, placeholder = "Add tag...", options }: TagInputProps,
) {
	const [value, setValue] = useState("")
	const [open, setOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [anchorRect, setAnchorRect] = useState<DOMRect>()

	const filteredOptions = matchSorter([...options], value)

	return (
		<Ariakit.ComboboxProvider
			open={open && filteredOptions.length > 0}
			setOpen={(open) => {
				setOpen(open)
				if (open) {
					setAnchorRect(ensure(inputRef.current).getBoundingClientRect())
				}
			}}
			value={value}
			setValue={setValue}
		>
			<Ariakit.Combobox
				className={twMerge(
					"text-sm text-primary-300 relative rounded-sm border-0 leading-4 w-full min-w-[100px]",
				)}
				ref={inputRef}
				placeholder={placeholder}
				data-focus-item
				data-focus-item-disabled={open || undefined}
				showOnKeyPress={false}
				autoSelect
				onKeyDown={(event) => {
					if (
						open && (event.key === "ArrowUp" || event.key === "ArrowDown")
					) {
						event.stopPropagation()
					}
					if (
						event.key === "Enter" &&
						(!open || filteredOptions.length === 0) &&
						value.trim()
					) {
						onAdd(value.trim())
						setValue("")
					}
					if (
						event.key === "Backspace" &&
						event.currentTarget.selectionStart === 0
					) {
						onBackspace()
					}
				}}
			/>
			<Ariakit.ComboboxPopover
				className="menu-panel"
				gutter={8}
				unmountOnHide
				portal
				// we don't want the popover to move around while it's open
				getAnchorRect={() => anchorRect ?? null}
			>
				{filteredOptions.map((option) => (
					<Ariakit.ComboboxItem
						key={option}
						className="menu-item"
						value={option}
						selectValueOnClick={false}
						setValueOnClick={false}
						hideOnClick={false}
						onClick={() => {
							onAdd(option)
							setValue("")
						}}
					>
						{option}
					</Ariakit.ComboboxItem>
				))}
			</Ariakit.ComboboxPopover>
		</Ariakit.ComboboxProvider>
	)
}
