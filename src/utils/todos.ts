import type { Todo, TodoFilter } from "@/types/todo";

/** Longest todo text allowed. Longer text is cut to this length. */
export const MAX_TODO_LENGTH = 200;

/** Returns a unique id: a base-36 timestamp plus random characters. */
export function generateId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}-${random}`;
}

export function createTodo(text: string, now: number = Date.now()): Todo {
  return {
    id: generateId(),
    text: text.trim().slice(0, MAX_TODO_LENGTH),
    createdAt: now,
    completed: false,
    archived: false,
  };
}

/** Adds a new todo to the front of the list. Returns the list unchanged if the text is blank. */
export function addTodo(todos: Todo[], text: string): Todo[] {
  if (text.trim().length === 0) return todos;
  return [createTodo(text), ...todos];
}

export function removeTodo(todos: Todo[], id: string): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

export function toggleComplete(todos: Todo[], id: string): Todo[] {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
}

export function toggleArchive(todos: Todo[], id: string): Todo[] {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, archived: !todo.archived } : todo,
  );
}

/** Returns the todos that match the filter, newest first. Does not modify the input. */
export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  return todos
    .filter((todo) => {
      switch (filter) {
        case "archived":
          return todo.archived;
        case "completed":
          return todo.completed && !todo.archived;
        case "open":
          return !todo.completed && !todo.archived;
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Counts how many todos match each filter. */
export function countTodos(todos: Todo[]): Record<TodoFilter, number> {
  const counts: Record<TodoFilter, number> = { open: 0, completed: 0, archived: 0 };
  for (const todo of todos) {
    if (todo.archived) counts.archived += 1;
    else if (todo.completed) counts.completed += 1;
    else counts.open += 1;
  }
  return counts;
}
