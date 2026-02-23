"use client";

import { getTodayPeople, todayParts } from "@/lib/dates";
import { getSettings, listPeople, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";

export type NotificationSupport = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
};

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return { supported: false, permission: "unsupported" };
  }
  return { supported: true, permission: Notification.permission };
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.requestPermission();
}

export async function maybeNotifyTodayBirthdays(): Promise<{ notified: boolean; count: number }> {
  if (typeof window === "undefined") return { notified: false, count: 0 };

  const settings = await getSettings();
  const people = await listPeople();
  const todayPeople = getTodayPeople(people);
  const todayIso = todayParts().iso;

  if (todayPeople.length === 0) return { notified: false, count: 0 };
  if (!settings.notificationEnabled) return { notified: false, count: todayPeople.length };
  if (settings.lastNotifiedDate === todayIso) return { notified: false, count: todayPeople.length };

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return { notified: false, count: todayPeople.length };
  }

  const names = todayPeople.slice(0, 3).map((p) => p.name).join(", ");
  const extra = todayPeople.length > 3 ? ` +${todayPeople.length - 3}` : "";
  const body = `${todayPeople.length} aniversariante(s) hoje: ${names}${extra}`;
  new Notification("BdayHub: aniversários de hoje", { body });

  const nextSettings: AppSettings = {
    ...settings,
    lastNotifiedDate: todayIso
  };
  await saveSettings(nextSettings);

  return { notified: true, count: todayPeople.length };
}
