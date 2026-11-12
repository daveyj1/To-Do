import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Todo } from "@/types/todo";

export const TODOS_STORAGE_KEY = "@todos/v1";

/**
 * Loads todos from storage. Returns [] if nothing is stored or the data is unreadable.
 * Only saveTodos writes this key, so the stored shape is trusted. If the Todo shape
 * changes, bump the key version and migrate the old data rather than dropping it.
 */
export async function loadTodos(): Promise<Todo[]> {
  try {
    const raw = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
    if (raw == null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Todo[]) : [];
  } catch (error) {
    console.warn("Failed to load todos", error);
    return [];
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.warn("Failed to save todos", error);
  }
}
