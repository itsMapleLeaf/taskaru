import { ClassNameValue, twMerge } from "tailwind-merge"

export const card = (...classes: ClassNameValue[]) =>
	twMerge(
		"bg-primary-800 rounded-lg",
		...classes,
	)

export const interactiveCard = (...classes: ClassNameValue[]) =>
	twMerge(
		card(),
		"transition hover:bg-primary-700",
		...classes,
	)
