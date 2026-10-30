import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { localPreviewEnabled } from "../infrastructure/local-preview";
export const colors = {
  background: "#FAF6EE",
  ink: "#283E37",
  muted: "#58655E",
  green: "#355B4B",
  pale: "#E7EBDD",
  peach: "#F1D6BE",
  white: "#FFFFFF",
  border: "#B5BEB1",
};
export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && { color: colors.ink },
          disabled && { color: colors.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
export function TextButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.textButton}
    >
      <Text style={styles.textButtonLabel}>{label}</Text>
    </Pressable>
  );
}
export function Screen({
  children,
  back = false,
  support = true,
}: {
  children: React.ReactNode;
  back?: boolean;
  support?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {back && (
          <Button
            label="Volver al inicio"
            secondary
            onPress={() => router.replace("/")}
          />
        )}
        <View style={styles.brand}>
          <View style={styles.sun} />
          <Text style={styles.eyebrow}>MINDFUL MORNING</Text>
        </View>
        {localPreviewEnabled && (
          <Text style={styles.small}>
            Modo de prueba local · Contenido en revisión
          </Text>
        )}
        {children}
        {support && (
          <Button
            label="Necesito apoyo"
            secondary
            onPress={() => router.push("/support")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    gap: 18,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingBottom: 40,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 14,
  },
  sun: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.peach,
    borderWidth: 1,
    borderColor: "#B38155",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    color: colors.ink,
    fontWeight: "600",
    flexShrink: 1,
  },
  title: { fontSize: 32, lineHeight: 40, color: colors.ink, fontWeight: "600" },
  body: { fontSize: 18, lineHeight: 28, color: colors.ink },
  card: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.pale,
    gap: 14,
  },
  button: {
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: colors.green,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.green,
  },
  secondary: { backgroundColor: "transparent", borderColor: colors.border },
  disabled: { backgroundColor: "#E4E5DE", borderColor: colors.border },
  buttonText: {
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
    fontWeight: "600",
    color: colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    color: colors.ink,
    minHeight: 56,
  },
  row: { gap: 10 },
  textButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignSelf: "center",
  },
  textButtonLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  small: { fontSize: 15, lineHeight: 23, color: colors.muted },
});
