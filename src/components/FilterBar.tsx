import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/theme/colors";
import type { TodoFilter } from "@/types/todo";

export const FILTERS: { value: TodoFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

type Props = {
  value: TodoFilter;
  counts: Record<TodoFilter, number>;
  onChange: (filter: TodoFilter) => void;
};

export function FilterBar({ value, counts, onChange }: Props) {
  const colors = useThemeColors();

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.segmentTrack }]}
      accessibilityRole="tablist"
    >
      {FILTERS.map((filter) => {
        const selected = filter.value === value;
        const count = counts[filter.value];
        return (
          <Pressable
            key={filter.value}
            testID={`filter-${filter.value}`}
            accessibilityRole="tab"
            accessibilityLabel={filter.label}
            accessibilityValue={{
              text: `${count} ${count === 1 ? "todo" : "todos"}`,
            }}
            accessibilityState={{ selected }}
            onPress={() => onChange(filter.value)}
            style={[
              styles.segment,
              selected && [
                styles.segmentSelected,
                { backgroundColor: colors.segmentSelected },
              ],
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.text : colors.textMuted },
                selected && styles.labelSelected,
              ]}
            >
              {filter.label}
            </Text>
            <Text
              testID={`filter-count-${filter.value}`}
              style={[styles.count, { color: colors.textMuted }]}
            >
              {count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 3,
    borderRadius: 9,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 7,
  },
  segmentSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  labelSelected: {
    fontWeight: "600",
  },
  count: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
