import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "../src/ui/components";
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
test("disabled answer remains accessible and cannot fire; skip can fire immediately", async () => {
  const answer = jest.fn(),
    skip = jest.fn();
  const view = await render(
    <>
      <Button label="Una respuesta" disabled onPress={answer} />
      <Button label="Prefiero no responder" onPress={skip} />
    </>,
  );
  await fireEvent.press(view.getByRole("button", { name: "Una respuesta" }));
  await fireEvent.press(
    view.getByRole("button", { name: "Prefiero no responder" }),
  );
  expect(answer).not.toHaveBeenCalled();
  expect(skip).toHaveBeenCalledTimes(1);
  expect(
    view.getByRole("button", { name: "Una respuesta" }).props.accessibilityState
      .disabled,
  ).toBe(true);
});
