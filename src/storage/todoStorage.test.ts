import AsyncStorage from "@react-native-async-storage/async-storage";

import { loadTodos, saveTodos, TODOS_STORAGE_KEY } from "@/storage/todoStorage";
import type { Todo } from "@/types/todo";

const sampleTodos: Todo[] = [
  { id: "a", text: "First", createdAt: 1, completed: false, archived: false },
  { id: "b", text: "Second", createdAt: 2, completed: true, archived: true },
];

describe("todoStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("loadTodos", () => {
    it("returns an empty list when nothing is stored", async () => {
      await expect(loadTodos()).resolves.toEqual([]);
    });

    it("returns the stored todos", async () => {
      await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(sampleTodos));
      await expect(loadTodos()).resolves.toEqual(sampleTodos);
    });

    it("returns an empty list and warns when the stored JSON is corrupt", async () => {
      await AsyncStorage.setItem(TODOS_STORAGE_KEY, "{not valid json");
      await expect(loadTodos()).resolves.toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    it("returns an empty list when the stored value is not an array", async () => {
      await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify({ id: "a" }));
      await expect(loadTodos()).resolves.toEqual([]);
    });

    it("returns an empty list and warns when reading fails", async () => {
      jest
        .spyOn(AsyncStorage, "getItem")
        .mockRejectedValueOnce(new Error("disk error"));
      await expect(loadTodos()).resolves.toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("saveTodos", () => {
    it("writes the todos as JSON under the storage key", async () => {
      await saveTodos(sampleTodos);
      const raw = await AsyncStorage.getItem(TODOS_STORAGE_KEY);
      expect(JSON.parse(raw!)).toEqual(sampleTodos);
    });

    it("round-trips through loadTodos", async () => {
      await saveTodos(sampleTodos);
      await expect(loadTodos()).resolves.toEqual(sampleTodos);
    });

    it("overwrites what was saved before", async () => {
      await saveTodos(sampleTodos);
      await saveTodos([sampleTodos[0]]);
      await expect(loadTodos()).resolves.toEqual([sampleTodos[0]]);
    });

    it("does not throw and warns when writing fails", async () => {
      jest
        .spyOn(AsyncStorage, "setItem")
        .mockRejectedValueOnce(new Error("disk full"));
      await expect(saveTodos(sampleTodos)).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
