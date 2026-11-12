export type Todo = {
  /** Unique identifier. Not shown in the UI. */
  id: string;
  text: string;
  /** Creation time in epoch milliseconds. Not shown in the UI. */
  createdAt: number;
  completed: boolean;
  archived: boolean;
};

export type TodoFilter = "open" | "completed" | "archived";
