import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "../src/ui/provider";
export default function Layout() {
  return (
    <Provider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </Provider>
  );
}
