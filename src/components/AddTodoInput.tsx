import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "@/theme/colors";
import { MAX_TODO_LENGTH } from "@/utils/todos";

type Props = {
  onAdd: (text: string) => void;
};

export function AddTodoInput({ onAdd }: Props) {
  const colors = useThemeColors();
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const canAdd = trimmed.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <View style={styles.row}>
      <TextInput
        testID="add-todo-input"
        accessibilityLabel="New todo"
        placeholder="What needs doing?"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
        maxLength={MAX_TODO_LENGTH}
        returnKeyType="done"
        submitBehavior="submit"
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />
      <Pressable
        testID="add-todo-button"
        accessibilityRole="button"
        accessibilityLabel="Add todo"
        accessibilityState={{ disabled: !canAdd }}
        disabled={!canAdd}
        onPress={handleAdd}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary },
          !canAdd && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    minHeight: 44,
    minWidth: 64,
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
