export function trace<T>(value: T): T {
	console.log(value)
	return value
}

export function* range(start: number, end: number, step = 1) {
	for (let i = start; i <= end; i += step) {
		yield i
	}
}

export function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t
}

export function lerpInverse(t: number, a: number, b: number) {
	return (t - a) / (b - a)
}
