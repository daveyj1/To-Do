import { StyleSheet, Text } from "react-native";

import { useThemeColors } from "@/theme/colors";
import type { TodoFilter } from "@/types/todo";

const MESSAGES: Record<TodoFilter, string> = {
  open: "No open todos. Add one above!",
  completed: "No completed todos yet.",
  archived: "No archived todos.",
};

export function EmptyState({ filter }: { filter: TodoFilter }) {
  const colors = useThemeColors();

  return (
    <Text testID="empty-state" style={[styles.text, { color: colors.textMuted }]}>
      {MESSAGES[filter]}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 15,
  },
});
