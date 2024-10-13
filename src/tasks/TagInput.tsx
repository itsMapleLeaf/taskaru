interface TagInputProps {
	onAdd: (tag: string) => void
	onBackspace: () => void
	placeholder?: string
}

export function TagInput(
	{ onAdd, onBackspace, placeholder = "Add tag..." }: TagInputProps,
) {
	return (
		<input
			className="text-sm text-primary-300 relative rounded-sm border-0 leading-4 w-full min-w-[100px]"
			placeholder={placeholder}
			data-focus-item
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					onAdd(event.currentTarget.value)
					event.currentTarget.value = ""
				}
				if (
					event.key === "Backspace" &&
					event.currentTarget.selectionStart === 0
				) {
					onBackspace()
				}
			}}
		/>
	)
}
