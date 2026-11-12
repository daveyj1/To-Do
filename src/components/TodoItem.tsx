import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useThemeColors } from "@/theme/colors";
import type { Todo } from "@/types/todo";

type Props = {
  todo: Todo;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleArchive: (id: string) => void;
};

const ACTION_WIDTH = 88;

// The swipe buttons sit behind the row until it's dragged open, so screen
// readers could focus buttons the user can't see. The row exposes the same
// actions through accessibilityActions instead.
const HIDDEN_FROM_SCREEN_READERS = {
  accessibilityElementsHidden: true, // iOS
  importantForAccessibility: "no-hide-descendants", // Android
} as const;

export function TodoItem({
  todo,
  onDelete,
  onToggleComplete,
  onToggleArchive,
}: Props) {
  const colors = useThemeColors();
  const completeLabel = todo.completed ? "Reopen" : "Complete";
  const archiveLabel = todo.archived ? "Unarchive" : "Archive";
  // Screen readers hear the status with the text, e.g. "Buy milk, completed".
  const rowLabel = [
    todo.text,
    todo.completed && "completed",
    todo.archived && "archived",
  ]
    .filter(Boolean)
    .join(", ");

  // Revealed by swiping right: Complete/Reopen and Archive/Unarchive.
  const renderLeftActions = (
    _progress: unknown,
    _translation: unknown,
    swipeable: SwipeableMethods,
  ) => (
    <View style={styles.actionGroup} {...HIDDEN_FROM_SCREEN_READERS}>
      <ActionButton
        testID={`todo-complete-${todo.id}`}
        label={completeLabel}
        accessibilityLabel={`${completeLabel} ${todo.text}`}
        color={colors.complete}
        onPress={() => {
          swipeable.close();
          onToggleComplete(todo.id);
        }}
      />
      <ActionButton
        testID={`todo-archive-${todo.id}`}
        label={archiveLabel}
        accessibilityLabel={`${archiveLabel} ${todo.text}`}
        color={colors.archive}
        onPress={() => {
          swipeable.close();
          onToggleArchive(todo.id);
        }}
      />
    </View>
  );

  // Revealed by swiping left: Delete. Deletes immediately, no confirmation.
  const renderRightActions = () => (
    <View style={styles.actionGroup} {...HIDDEN_FROM_SCREEN_READERS}>
      <ActionButton
        testID={`todo-delete-${todo.id}`}
        label="Delete"
        accessibilityLabel={`Delete ${todo.text}`}
        color={colors.danger}
        onPress={() => onDelete(todo.id)}
      />
    </View>
  );

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <ReanimatedSwipeable
        testID={`todo-item-${todo.id}`}
        containerStyle={styles.swipeContainer}
        friction={2}
        leftThreshold={40}
        rightThreshold={40}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
      >
        <View
          style={[styles.row, { backgroundColor: colors.surface }]}
          accessible
          accessibilityLabel={rowLabel}
          accessibilityHint="Actions available: complete, archive, delete"
          accessibilityActions={[
            { name: "toggleComplete", label: completeLabel },
            { name: "toggleArchive", label: archiveLabel },
            { name: "delete", label: "Delete" },
          ]}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === "toggleComplete") onToggleComplete(todo.id);
            if (nativeEvent.actionName === "toggleArchive") onToggleArchive(todo.id);
            if (nativeEvent.actionName === "delete") onDelete(todo.id);
          }}
        >
          <Text
            testID={`todo-text-${todo.id}`}
            style={[
              styles.text,
              { color: todo.completed ? colors.textMuted : colors.text },
              todo.completed && styles.textCompleted,
            ]}
          >
            {todo.text}
          </Text>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

type ActionButtonProps = {
  testID: string;
  label: string;
  accessibilityLabel: string;
  color: string;
  onPress: () => void;
};

function ActionButton({
  testID,
  label,
  accessibilityLabel,
  color,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: color },
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  text: {
    fontSize: 16,
  },
  textCompleted: {
    textDecorationLine: "line-through",
  },
  actionGroup: {
    flexDirection: "row",
  },
  action: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
});
