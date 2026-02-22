type StorageListener = () => void

const keyListeners = new Map<string, Set<StorageListener>>()
const globalListeners = new Set<StorageListener>()

/**
 * Subscribes a listener function to changes for a specific storage key.
 *
 * Registers the provided listener for the given key. When the key changes,
 * the listener will be notified. Returns an unsubscribe function to remove
 * the listener when it is no longer needed.
 *
 * @param key - The storage key to listen for changes on.
 * @param listener - The callback function to invoke when the key changes.
 * @returns A function that unsubscribes the listener from the key.
 */
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

/**
 * Subscribes a listener to global storage events.
 *
 * Adds the provided `listener` to the set of global listeners, enabling it to respond to storage changes.
 * Returns a function that, when called, unsubscribes the listener from global storage events.
 *
 * @param listener - The function to be called when a global storage event occurs.
 * @returns A function to unsubscribe the listener from global storage events.
 */
export function subscribeStorageGlobal(listener: StorageListener): () => void {
  globalListeners.add(listener)
  return () => {
    globalListeners.delete(listener)
  }
}

/**
 * Notifies all listeners associated with a specific storage key, as well as all global listeners.
 *
 * @param key - The storage key whose listeners should be notified.
 *
 * @remarks
 * This function triggers all registered listeners for the provided key, followed by all global listeners.
 */
export function notifyStorageKeyListeners(key: string): void {
  keyListeners.get(key)?.forEach((listener) => listener())
  globalListeners.forEach((listener) => listener())
}

/**
 * Notifies all global storage listeners of a change.
 *
 * This function iterates through all registered global listeners and invokes them, allowing them to respond to storage changes.
 */
export function notifyAllStorageListeners(): void {
  globalListeners.forEach((listener) => listener())
}
