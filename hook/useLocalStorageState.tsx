import {
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"

export function useLocalStorageState<T>(key: string, initialValue: T) {
	const subscribe = useCallback(
		(callback: () => void) => {
			const handler = (e: StorageEvent) => {
				if (e.key === key) callback()
			}
			window.addEventListener("storage", handler)
			return () => window.removeEventListener("storage", handler)
		},
		[key],
	)

	const getSnapshot = useCallback(() => {
		const item = localStorage.getItem(key)
		return item ?? JSON.stringify(initialValue)
	}, [key, initialValue])

	const getServerSnapshot = useCallback(
		() => JSON.stringify(initialValue),
		[initialValue],
	)

	const rawValue = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	)
	const value = useMemo(() => JSON.parse(rawValue) as T, [rawValue])

	const setValue = useCallback(
		(newValue: T | ((prev: T) => T)) => {
			const valueToStore =
				newValue instanceof Function
					? newValue(
							JSON.parse(
								localStorage.getItem(key) ?? JSON.stringify(initialValue),
							),
						)
					: newValue
			localStorage.setItem(key, JSON.stringify(valueToStore))
			window.dispatchEvent(new StorageEvent("storage", { key }))
		},
		[key, initialValue],
	)

	return [value, setValue] as const
}