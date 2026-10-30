import * as Notifications from "expo-notifications";
import { reconcileReminder } from "../src/infrastructure/system";
import { defaults } from "../src/application/model";
jest.mock("expo-notifications", () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => ""),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
}));
test("defaults never request notification permission or schedule", async () => {
  expect(await reconcileReminder(defaults("test"))).toBe(false);
  expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});
test("denial is not requested again on foreground reconciliation", async () => {
  const s = { ...defaults("test"), reminderEnabled: true };
  expect(await reconcileReminder(s, true)).toBe(false);
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(await reconcileReminder(s, false)).toBe(false);
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
});
test("enabled reminder cancels stale schedules and creates exactly one daily local notification", async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
    granted: true,
  } as Notifications.NotificationPermissionsStatus);
  expect(
    await reconcileReminder({
      ...defaults("test"),
      reminderEnabled: true,
      reminderTime: "08:15",
    }),
  ).toBe(true);
  expect(
    Notifications.cancelAllScheduledNotificationsAsync,
  ).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      trigger: { type: "daily", hour: 8, minute: 15, channelId: "morning" },
    }),
  );
});
