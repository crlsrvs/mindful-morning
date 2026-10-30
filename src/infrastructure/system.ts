import * as Crypto from "expo-crypto";
import { getCalendars } from "expo-localization";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Clock, Settings } from "../application/model";
export const clock: Clock = {
  localDate: () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  utc: () => new Date().toISOString(),
  timeZone: () =>
    getCalendars()[0]?.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  offsetMinutes: () => -new Date().getTimezoneOffset(),
  uuid: () => Crypto.randomUUID(),
};
export const cancelReminders = () =>
  Notifications.cancelAllScheduledNotificationsAsync();
export async function reconcileReminder(
  settings: Settings,
  requestPermission = false,
): Promise<boolean> {
  await cancelReminders();
  if (!settings.reminderEnabled) return false;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("morning", {
      name: "Mi momento",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  const [hour, minute] = settings.reminderTime.split(":").map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: "morning-local",
    content: {
      title: "Un momento para ti",
      body: "Si te apetece, tienes un momento para ti",
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "morning",
    },
  });
  return true;
}
