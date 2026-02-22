type StorageListener = () => void

const keyListeners = new Map<string, Set<StorageListener>>()
const globalListeners = new Set<StorageListener>()

export function subscribeStorageKey(
  key: string,
  listener: StorageListener,
): () => void {
  if (!keyListeners.has(key)) keyListeners.set(key, new Set())
  const listeners = keyListeners.get(key)!
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) keyListeners.delete(key)
  }
}

export function subscribeStorageGlobal(listener: StorageListener): () => void {
  globalListeners.add(listener)
  return () => {
    globalListeners.delete(listener)
  }
}

export function notifyStorageKeyListeners(key: string): void {
  keyListeners.get(key)?.forEach((listener) => listener())
  globalListeners.forEach((listener) => listener())
}

export function notifyAllStorageListeners(): void {
  globalListeners.forEach((listener) => listener())
}
