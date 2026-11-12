import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddTodoInput } from "@/components/AddTodoInput";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { TodoItem } from "@/components/TodoItem";
import { useTodos } from "@/hooks/useTodos";
import { useThemeColors } from "@/theme/colors";
import type { TodoFilter } from "@/types/todo";
import { countTodos, filterTodos } from "@/utils/todos";

export default function Index() {
  const colors = useThemeColors();
  const { todos, isLoaded, add, remove, toggleCompleted, toggleArchived } =
    useTodos();
  const [filter, setFilter] = useState<TodoFilter>("open");

  const visibleTodos = useMemo(
    () => filterTodos(todos, filter),
    [todos, filter],
  );
  const counts = useMemo(() => countTodos(todos), [todos]);

  const handleAdd = (text: string) => {
    add(text);
    // New todos are open, so switch to the Open view to show the new item.
    setFilter("open");
    announce(`Added ${text}`);
  };

  // Each action moves or removes the item from the current tab, so tell
  // screen reader users what happened.
  const handleToggleComplete = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    toggleCompleted(id);
    if (todo) announce(`${todo.text} ${todo.completed ? "reopened" : "completed"}`);
  };

  const handleToggleArchive = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    toggleArchived(id);
    if (todo) announce(`${todo.text} ${todo.archived ? "unarchived" : "archived"}`);
  };

  const handleDelete = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    remove(id);
    if (todo) announce(`${todo.text} deleted`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        Todos
      </Text>
      <AddTodoInput onAdd={handleAdd} />
      <FilterBar value={filter} counts={counts} onChange={setFilter} />
      {!isLoaded ? (
        <ActivityIndicator
          style={styles.loading}
          color={colors.textMuted}
          accessibilityLabel="Loading todos"
        />
      ) : (
        <Animated.FlatList
          data={visibleTodos}
          keyExtractor={(todo) => todo.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
              onToggleArchive={handleToggleArchive}
            />
          )}
          itemLayoutAnimation={LinearTransition.duration(200)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={<EmptyState filter={filter} />}
        />
      )}
    </SafeAreaView>
  );
}

function announce(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loading: {
    marginTop: 32,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
});
