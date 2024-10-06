import { ClassNameValue, twMerge } from "https://esm.sh/tailwind-merge@1.14.0"

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
