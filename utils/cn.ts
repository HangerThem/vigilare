import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class values into a single string, handling conditional and array-based class names.
 * Utilizes `clsx` for class name composition and `twMerge` for Tailwind CSS class deduplication.
 *
 * @param inputs - A list of class values (strings, arrays, or objects) to be merged.
 * @returns A single string of merged class names with Tailwind CSS conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
