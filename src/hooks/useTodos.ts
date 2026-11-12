import { useCallback, useEffect, useState } from "react";

import { loadTodos, saveTodos } from "@/storage/todoStorage";
import type { Todo } from "@/types/todo";
import {
  addTodo,
  removeTodo,
  toggleArchive,
  toggleComplete,
} from "@/utils/todos";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTodos().then((stored) => {
      if (cancelled) return;
      setTodos(stored);
      setIsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Don't save until the first load finishes, so the initial empty list
  // never overwrites what's in storage.
  useEffect(() => {
    if (isLoaded) saveTodos(todos);
  }, [todos, isLoaded]);

  const add = useCallback(
    (text: string) => setTodos((prev) => addTodo(prev, text)),
    [],
  );
  const remove = useCallback(
    (id: string) => setTodos((prev) => removeTodo(prev, id)),
    [],
  );
  const toggleCompleted = useCallback(
    (id: string) => setTodos((prev) => toggleComplete(prev, id)),
    [],
  );
  const toggleArchived = useCallback(
    (id: string) => setTodos((prev) => toggleArchive(prev, id)),
    [],
  );

  return {
    todos,
    isLoaded,
    add,
    remove,
    toggleCompleted,
    toggleArchived,
  };
}
