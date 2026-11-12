import type { Todo } from "@/types/todo";
import {
  addTodo,
  countTodos,
  createTodo,
  filterTodos,
  generateId,
  MAX_TODO_LENGTH,
  removeTodo,
  toggleArchive,
  toggleComplete,
} from "@/utils/todos";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "id-1",
    text: "Test todo",
    createdAt: 1000,
    completed: false,
    archived: false,
    ...overrides,
  };
}

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique ids across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});

describe("createTodo", () => {
  it("creates an open, unarchived todo with an id and timestamp", () => {
    const todo = createTodo("Buy milk", 12345);
    expect(todo).toEqual({
      id: expect.any(String),
      text: "Buy milk",
      createdAt: 12345,
      completed: false,
      archived: false,
    });
  });

  it("trims surrounding whitespace from the text", () => {
    expect(createTodo("  Buy milk  ").text).toBe("Buy milk");
  });

  it("cuts text longer than MAX_TODO_LENGTH", () => {
    const long = "x".repeat(MAX_TODO_LENGTH + 50);
    expect(createTodo(long).text).toHaveLength(MAX_TODO_LENGTH);
  });

  it("defaults createdAt to the current time", () => {
    jest.spyOn(Date, "now").mockReturnValue(99999);
    expect(createTodo("Now").createdAt).toBe(99999);
    jest.restoreAllMocks();
  });
});

describe("addTodo", () => {
  it("adds the new todo to the front of the list", () => {
    const existing = [makeTodo({ id: "a" })];
    const result = addTodo(existing, "New");
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("New");
    expect(result[1].id).toBe("a");
  });

  it("returns the same list when the text is blank", () => {
    const existing = [makeTodo()];
    expect(addTodo(existing, "")).toBe(existing);
    expect(addTodo(existing, "   ")).toBe(existing);
  });

  it("does not modify the original list", () => {
    const existing = [makeTodo()];
    addTodo(existing, "New");
    expect(existing).toHaveLength(1);
  });
});

describe("removeTodo", () => {
  it("removes the todo with the matching id", () => {
    const todos = [makeTodo({ id: "a" }), makeTodo({ id: "b" })];
    expect(removeTodo(todos, "a").map((t) => t.id)).toEqual(["b"]);
  });

  it("leaves the list unchanged when the id is not found", () => {
    const todos = [makeTodo({ id: "a" })];
    expect(removeTodo(todos, "missing")).toEqual(todos);
  });

  it("does not modify the original list", () => {
    const todos = [makeTodo({ id: "a" })];
    removeTodo(todos, "a");
    expect(todos).toHaveLength(1);
  });
});

describe("toggleComplete", () => {
  it("marks an open todo as completed and back again", () => {
    const todos = [makeTodo({ id: "a" })];
    const completed = toggleComplete(todos, "a");
    expect(completed[0].completed).toBe(true);
    expect(toggleComplete(completed, "a")[0].completed).toBe(false);
  });

  it("only changes the matching todo", () => {
    const todos = [makeTodo({ id: "a" }), makeTodo({ id: "b" })];
    const result = toggleComplete(todos, "a");
    expect(result[1]).toBe(todos[1]);
    expect(result[1].completed).toBe(false);
  });

  it("does not modify the original todo", () => {
    const todos = [makeTodo({ id: "a" })];
    toggleComplete(todos, "a");
    expect(todos[0].completed).toBe(false);
  });

  it("keeps the archived flag", () => {
    const todos = [makeTodo({ id: "a", archived: true })];
    expect(toggleComplete(todos, "a")[0].archived).toBe(true);
  });
});

describe("toggleArchive", () => {
  it("archives a todo and unarchives it again", () => {
    const todos = [makeTodo({ id: "a" })];
    const archived = toggleArchive(todos, "a");
    expect(archived[0].archived).toBe(true);
    expect(toggleArchive(archived, "a")[0].archived).toBe(false);
  });

  it("keeps the completed flag so unarchiving restores the previous state", () => {
    const todos = [makeTodo({ id: "a", completed: true })];
    const restored = toggleArchive(toggleArchive(todos, "a"), "a");
    expect(restored[0]).toEqual(todos[0]);
  });

  it("does not modify the original todo", () => {
    const todos = [makeTodo({ id: "a" })];
    toggleArchive(todos, "a");
    expect(todos[0].archived).toBe(false);
  });
});

describe("filterTodos", () => {
  const open = makeTodo({ id: "open", createdAt: 1 });
  const completed = makeTodo({ id: "completed", createdAt: 2, completed: true });
  const archivedOpen = makeTodo({ id: "archived-open", createdAt: 3, archived: true });
  const archivedCompleted = makeTodo({
    id: "archived-completed",
    createdAt: 4,
    completed: true,
    archived: true,
  });
  const all = [open, completed, archivedOpen, archivedCompleted];

  const ids = (todos: Todo[]) => todos.map((t) => t.id);

  it("open: returns todos that are neither completed nor archived", () => {
    expect(ids(filterTodos(all, "open"))).toEqual(["open"]);
  });

  it("completed: returns completed todos that are not archived", () => {
    expect(ids(filterTodos(all, "completed"))).toEqual(["completed"]);
  });

  it("archived: returns every archived todo, completed or not", () => {
    expect(ids(filterTodos(all, "archived"))).toEqual([
      "archived-completed",
      "archived-open",
    ]);
  });

  it("sorts newest first by createdAt", () => {
    const todos = [
      makeTodo({ id: "old", createdAt: 1 }),
      makeTodo({ id: "new", createdAt: 3 }),
      makeTodo({ id: "mid", createdAt: 2 }),
    ];
    expect(ids(filterTodos(todos, "open"))).toEqual(["new", "mid", "old"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterTodos([open], "archived")).toEqual([]);
    expect(filterTodos([], "open")).toEqual([]);
  });

  it("does not modify or reorder the original list", () => {
    const copy = [...all];
    filterTodos(all, "archived");
    expect(all).toEqual(copy);
  });
});

describe("countTodos", () => {
  it("counts each todo under exactly one filter", () => {
    const todos = [
      makeTodo({ id: "1" }),
      makeTodo({ id: "2" }),
      makeTodo({ id: "3", completed: true }),
      makeTodo({ id: "4", archived: true }),
      makeTodo({ id: "5", completed: true, archived: true }),
    ];
    expect(countTodos(todos)).toEqual({ open: 2, completed: 1, archived: 2 });
  });

  it("returns zero for every filter when there are no todos", () => {
    expect(countTodos([])).toEqual({ open: 0, completed: 0, archived: 0 });
  });
});
