import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Index from "@/app/index";
import { TODOS_STORAGE_KEY } from "@/storage/todoStorage";
import type { Todo } from "@/types/todo";

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

async function seedStorage(todos: Todo[]) {
  await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
}

async function readStorage(): Promise<Todo[]> {
  const raw = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Matches the root layout (src/app/_layout.tsx), which swipeable rows require.
function Providers({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
  );
}

/** Renders the screen and waits for stored todos to finish loading. */
async function renderScreen() {
  await render(<Index />, { wrapper: Providers });
  await waitFor(() =>
    expect(screen.queryByLabelText("Loading todos")).not.toBeOnTheScreen(),
  );
}

type RowAction = "toggleComplete" | "toggleArchive" | "delete";

/**
 * Runs one of a row's accessibility actions, the way a screen reader does.
 * These call the same handlers as the swipe buttons. The swipe itself can't be
 * simulated reliably in Jest (the hidden buttons have pointerEvents "none"
 * until the row is dragged open), so it's covered by manual testing.
 */
async function runRowAction(todoText: string, actionName: RowAction) {
  // Row labels are the text plus any status, e.g. "Buy milk, completed".
  const escaped = todoText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const row = screen.getByLabelText(new RegExp(`^${escaped}(,|$)`));
  await fireEvent(row, "accessibilityAction", {
    nativeEvent: { actionName },
  });
}

describe("Todo screen", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("adding todos", () => {
    it("shows the empty state for Open when there are no todos", async () => {
      await renderScreen();
      expect(
        screen.getByText("No open todos. Add one above!"),
      ).toBeOnTheScreen();
    });

    it("adds a todo, clears the input and saves it", async () => {
      const user = userEvent.setup();
      await renderScreen();

      const input = screen.getByLabelText("New todo");
      await user.type(input, "Buy milk");
      await user.press(screen.getByRole("button", { name: "Add todo" }));

      expect(screen.getByText("Buy milk")).toBeOnTheScreen();
      expect(input).toHaveDisplayValue("");
      expect(await readStorage()).toEqual([
        expect.objectContaining({
          text: "Buy milk",
          completed: false,
          archived: false,
        }),
      ]);
    });

    it("adds a todo when the keyboard submit key is pressed", async () => {
      const user = userEvent.setup();
      await renderScreen();

      await user.type(screen.getByLabelText("New todo"), "Walk dog", {
        submitEditing: true,
      });

      expect(screen.getByText("Walk dog")).toBeOnTheScreen();
    });

    it("trims whitespace from the todo text", async () => {
      const user = userEvent.setup();
      await renderScreen();

      await user.type(screen.getByLabelText("New todo"), "   Spaced   ");
      await user.press(screen.getByRole("button", { name: "Add todo" }));

      expect(screen.getByText("Spaced")).toBeOnTheScreen();
    });

    it("disables Add while the input is empty or whitespace", async () => {
      const user = userEvent.setup();
      await renderScreen();

      const addButton = screen.getByRole("button", { name: "Add todo" });
      expect(addButton).toBeDisabled();

      await user.type(screen.getByLabelText("New todo"), "   ");
      expect(addButton).toBeDisabled();
      await user.press(addButton);
      expect(screen.getByText("No open todos. Add one above!")).toBeOnTheScreen();
      expect(await readStorage()).toEqual([]);
    });

    it("shows newest todos first", async () => {
      const user = userEvent.setup();
      await renderScreen();

      const input = screen.getByLabelText("New todo");
      await user.type(input, "First");
      await user.press(screen.getByRole("button", { name: "Add todo" }));
      await user.type(input, "Second");
      await user.press(screen.getByRole("button", { name: "Add todo" }));

      const texts = screen
        .getAllByTestId(/^todo-text-/)
        .map((node) => node.props.children);
      expect(texts).toEqual(["Second", "First"]);
    });

    it("switches back to Open when adding from another filter", async () => {
      const user = userEvent.setup();
      await renderScreen();

      await user.press(screen.getByRole("tab", { name: "Archived" }));
      await user.type(screen.getByLabelText("New todo"), "New task");
      await user.press(screen.getByRole("button", { name: "Add todo" }));

      expect(screen.getByRole("tab", { name: "Open" })).toBeSelected();
      expect(screen.getByText("New task")).toBeOnTheScreen();
    });
  });

  describe("persistence", () => {
    it("shows todos saved in a previous session", async () => {
      await seedStorage([
        makeTodo({ id: "a", text: "Saved earlier", createdAt: 1 }),
      ]);
      await renderScreen();

      expect(await screen.findByText("Saved earlier")).toBeOnTheScreen();
    });
  });

  describe("todo actions", () => {
    it("completing a todo moves it to Completed with a strike-through", async () => {
      const user = userEvent.setup();
      await seedStorage([makeTodo({ id: "a", text: "Finish report" })]);
      await renderScreen();

      await runRowAction("Finish report", "toggleComplete");

      expect(screen.queryByText("Finish report")).not.toBeOnTheScreen();
      expect(screen.getByText("No open todos. Add one above!")).toBeOnTheScreen();

      await user.press(screen.getByRole("tab", { name: "Completed" }));
      const text = screen.getByText("Finish report");
      expect(text).toHaveStyle({ textDecorationLine: "line-through" });
      expect((await readStorage())[0].completed).toBe(true);
    });

    it("reopening a completed todo moves it back to Open without a strike-through", async () => {
      const user = userEvent.setup();
      await seedStorage([
        makeTodo({ id: "a", text: "Finish report", completed: true }),
      ]);
      await renderScreen();

      await user.press(screen.getByRole("tab", { name: "Completed" }));
      await runRowAction("Finish report", "toggleComplete");
      await user.press(screen.getByRole("tab", { name: "Open" }));

      expect(screen.getByText("Finish report")).not.toHaveStyle({
        textDecorationLine: "line-through",
      });
    });

    it("archiving a todo moves it to Archived", async () => {
      const user = userEvent.setup();
      await seedStorage([makeTodo({ id: "a", text: "Old idea" })]);
      await renderScreen();

      await runRowAction("Old idea", "toggleArchive");
      expect(screen.queryByText("Old idea")).not.toBeOnTheScreen();

      await user.press(screen.getByRole("tab", { name: "Archived" }));
      expect(screen.getByText("Old idea")).toBeOnTheScreen();
      expect((await readStorage())[0].archived).toBe(true);
    });

    it("unarchiving a completed todo returns it to Completed", async () => {
      const user = userEvent.setup();
      await seedStorage([
        makeTodo({ id: "a", text: "Done thing", completed: true, archived: true }),
      ]);
      await renderScreen();

      await user.press(screen.getByRole("tab", { name: "Archived" }));
      await runRowAction("Done thing", "toggleArchive");
      expect(screen.getByText("No archived todos.")).toBeOnTheScreen();

      await user.press(screen.getByRole("tab", { name: "Completed" }));
      expect(screen.getByText("Done thing")).toBeOnTheScreen();
    });

    it("deleting a todo removes it from the list and storage", async () => {
      await seedStorage([
        makeTodo({ id: "a", text: "Keep me", createdAt: 1 }),
        makeTodo({ id: "b", text: "Delete me", createdAt: 2 }),
      ]);
      await renderScreen();

      await runRowAction("Delete me", "delete");

      expect(screen.queryByText("Delete me")).not.toBeOnTheScreen();
      expect(screen.getByText("Keep me")).toBeOnTheScreen();
      expect((await readStorage()).map((t) => t.id)).toEqual(["a"]);
    });
  });

  describe("filtering", () => {
    beforeEach(async () => {
      await seedStorage([
        makeTodo({ id: "o", text: "Open item", createdAt: 1 }),
        makeTodo({ id: "c", text: "Completed item", createdAt: 2, completed: true }),
        makeTodo({ id: "a", text: "Archived item", createdAt: 3, archived: true }),
      ]);
    });

    it("starts on the Open filter", async () => {
      await renderScreen();

      expect(screen.getByRole("tab", { name: "Open" })).toBeSelected();
      expect(screen.getByText("Open item")).toBeOnTheScreen();
      expect(screen.queryByText("Completed item")).not.toBeOnTheScreen();
      expect(screen.queryByText("Archived item")).not.toBeOnTheScreen();
    });

    it.each([
      ["Completed", "Completed item"],
      ["Archived", "Archived item"],
    ])("shows only matching todos on the %s filter", async (tab, visible) => {
      const user = userEvent.setup();
      await renderScreen();

      await user.press(screen.getByRole("tab", { name: tab }));

      expect(screen.getByRole("tab", { name: tab })).toBeSelected();
      expect(screen.getByRole("tab", { name: "Open" })).not.toBeSelected();
      expect(screen.getByText(visible)).toBeOnTheScreen();
      expect(screen.getAllByTestId(/^todo-text-/)).toHaveLength(1);
    });
  });

  describe("screen reader announcements", () => {
    let announce: jest.SpyInstance;

    beforeEach(() => {
      announce = jest
        .spyOn(AccessibilityInfo, "announceForAccessibility")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      announce.mockRestore();
    });

    it("announces when a todo is added", async () => {
      const user = userEvent.setup();
      await renderScreen();

      await user.type(screen.getByLabelText("New todo"), "Buy milk");
      await user.press(screen.getByRole("button", { name: "Add todo" }));

      expect(announce).toHaveBeenCalledWith("Added Buy milk");
    });

    it.each([
      [{}, "toggleComplete", "Task completed"],
      [{ completed: true }, "toggleComplete", "Task reopened"],
      [{}, "toggleArchive", "Task archived"],
      [{ archived: true }, "toggleArchive", "Task unarchived"],
      [{}, "delete", "Task deleted"],
    ] as const)(
      "announces the result of %j + %s",
      async (overrides, action, message) => {
        const user = userEvent.setup();
        await seedStorage([makeTodo({ id: "a", text: "Task", ...overrides })]);
        await renderScreen();

        const tab =
          "archived" in overrides ? "Archived" : "completed" in overrides ? "Completed" : "Open";
        await user.press(screen.getByRole("tab", { name: tab }));
        await runRowAction("Task", action);

        expect(announce).toHaveBeenCalledWith(message);
      },
    );
  });

  describe("filter counts", () => {
    it("shows how many todos are in each filter and updates after changes", async () => {
      await seedStorage([
        makeTodo({ id: "o1", text: "Open one", createdAt: 1 }),
        makeTodo({ id: "o2", text: "Open two", createdAt: 2 }),
        makeTodo({ id: "c", text: "Done", createdAt: 3, completed: true }),
      ]);
      await renderScreen();

      expect(screen.getByTestId("filter-count-open")).toHaveTextContent("2");
      expect(screen.getByTestId("filter-count-completed")).toHaveTextContent("1");
      expect(screen.getByTestId("filter-count-archived")).toHaveTextContent("0");
      expect(screen.getByRole("tab", { name: "Open" })).toHaveAccessibilityValue({
        text: "2 todos",
      });

      await runRowAction("Open one", "toggleArchive");

      expect(screen.getByTestId("filter-count-open")).toHaveTextContent("1");
      expect(screen.getByTestId("filter-count-archived")).toHaveTextContent("1");
      expect(screen.getByRole("tab", { name: "Archived" })).toHaveAccessibilityValue({
        text: "1 todo",
      });
    });
  });

  describe("empty states", () => {
    it.each([
      ["Open", "No open todos. Add one above!"],
      ["Completed", "No completed todos yet."],
      ["Archived", "No archived todos."],
    ])("shows the %s empty message", async (tab, message) => {
      const user = userEvent.setup();
      await renderScreen();

      await user.press(screen.getByRole("tab", { name: tab }));
      expect(screen.getByText(message)).toBeOnTheScreen();
    });
  });
});
