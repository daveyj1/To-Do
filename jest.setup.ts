// Replaces the native AsyncStorage module with the library's in-memory mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Gives SafeAreaView fixed insets so screens render without a native provider.
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

// Replaces the native worklets runtime that Reanimated and gesture handler use.
jest.mock("react-native-worklets", () =>
  require("react-native-worklets/src/mock"),
);
