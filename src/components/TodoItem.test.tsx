import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { TodoItem } from "@/components/TodoItem";
import type { Todo } from "@/types/todo";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "id-1",
    text: "Water plants",
    createdAt: 1000,
    completed: false,
    archived: false,
    ...overrides,
  };
}

function Providers({ children }: { children: ReactNode }) {
  return <GestureHandlerRootView>{children}</GestureHandlerRootView>;
}

async function renderItem(todo: Todo) {
  const handlers = {
    onDelete: jest.fn(),
    onToggleComplete: jest.fn(),
    onToggleArchive: jest.fn(),
  };
  await render(<TodoItem todo={todo} {...handlers} />, { wrapper: Providers });
  return handlers;
}

/** The row's accessible element. Its label starts with the todo text. */
function getRow() {
  return screen.getByLabelText(/^Water plants/);
}

function actionLabels() {
  return getRow().props.accessibilityActions.map(
    (a: { label: string }) => a.label,
  );
}

/** Swipe buttons are hidden from screen readers, so include hidden elements. */
function getSwipeButton(name: string) {
  return screen.getByRole("button", { name, includeHiddenElements: true });
}

describe("TodoItem", () => {
  it("shows an open todo without a strike-through", async () => {
    await renderItem(makeTodo());

    expect(screen.getByText("Water plants")).not.toHaveStyle({
      textDecorationLine: "line-through",
    });
  });

  it("strikes through a completed todo", async () => {
    await renderItem(makeTodo({ completed: true }));

    expect(screen.getByText("Water plants")).toHaveStyle({
      textDecorationLine: "line-through",
    });
  });

  it.each([
    ["open", {}, "Water plants"],
    ["completed", { completed: true }, "Water plants, completed"],
    ["archived", { archived: true }, "Water plants, archived"],
    [
      "completed and archived",
      { completed: true, archived: true },
      "Water plants, completed, archived",
    ],
  ])("announces the status of a %s todo in its label", async (_, overrides, label) => {
    await renderItem(makeTodo(overrides));
    expect(screen.getByLabelText(label)).toBeOnTheScreen();
  });

  it("hides the swipe buttons from screen readers", async () => {
    await renderItem(makeTodo());

    expect(
      screen.queryByRole("button", { name: "Delete Water plants" }),
    ).not.toBeOnTheScreen();
    expect(getSwipeButton("Delete Water plants")).toBeOnTheScreen();
  });

  it("offers Complete, Archive and Delete for an open todo", async () => {
    await renderItem(makeTodo());

    expect(getSwipeButton("Complete Water plants")).toBeOnTheScreen();
    expect(getSwipeButton("Archive Water plants")).toBeOnTheScreen();
    expect(getSwipeButton("Delete Water plants")).toBeOnTheScreen();
    expect(actionLabels()).toEqual(["Complete", "Archive", "Delete"]);
  });

  it("offers Reopen for a completed todo", async () => {
    await renderItem(makeTodo({ completed: true }));

    expect(getSwipeButton("Reopen Water plants")).toBeOnTheScreen();
    expect(actionLabels()).toEqual(["Reopen", "Archive", "Delete"]);
  });

  it("offers Unarchive for an archived todo", async () => {
    await renderItem(makeTodo({ archived: true }));

    expect(getSwipeButton("Unarchive Water plants")).toBeOnTheScreen();
    expect(actionLabels()).toEqual(["Complete", "Unarchive", "Delete"]);
  });

  it.each([
    ["toggleComplete", "onToggleComplete"],
    ["toggleArchive", "onToggleArchive"],
    ["delete", "onDelete"],
  ] as const)(
    "the %s accessibility action calls %s with the todo id",
    async (actionName, handlerName) => {
      const handlers = await renderItem(makeTodo({ id: "abc" }));

      await fireEvent(
        getRow(),
        "accessibilityAction",
        { nativeEvent: { actionName } },
      );

      expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
      expect(handlers[handlerName]).toHaveBeenCalledWith("abc");
      for (const [name, fn] of Object.entries(handlers)) {
        if (name !== handlerName) expect(fn).not.toHaveBeenCalled();
      }
    },
  );
});
