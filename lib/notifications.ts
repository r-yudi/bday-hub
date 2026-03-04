"use client";

import { getTodayPeople, todayParts } from "@/lib/dates";
import { getSettings, listPeople, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";

const DEEP_LINK_PATH = "/today";

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

/** Parse "HH:mm" to minutes since midnight; returns null if invalid. */
function parseTimeToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** True if current local time is at or after the given "HH:mm". */
function isAtOrAfterNotificationTime(hhmm: string): boolean {
  const target = parseTimeToMinutes(hhmm);
  if (target === null) return true;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= target;
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
  if (!isAtOrAfterNotificationTime(settings.notificationTime)) return { notified: false, count: todayPeople.length };

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return { notified: false, count: todayPeople.length };
  }

  const title =
    todayPeople.length === 1
      ? `Hoje é aniversário de ${todayPeople[0].name} 🎉`
      : `Hoje: ${todayPeople.length} aniversários 🎉`;
  const names = todayPeople.slice(0, 3).map((p) => p.name).join(", ");
  const extra = todayPeople.length > 3 ? ` +${todayPeople.length - 3}` : "";
  const body =
    todayPeople.length === 1
      ? "Abra o Lembra para enviar parabéns rapidamente."
      : `Aniversariantes de hoje: ${names}${extra}`;

  const notification = new Notification(title, { body, tag: "lembra-today" });
  notification.onclick = () => {
    window.focus();
    if (typeof window !== "undefined" && window.location) {
      const base = window.location.origin;
      window.location.href = base + (DEEP_LINK_PATH.startsWith("/") ? DEEP_LINK_PATH : `/${DEEP_LINK_PATH}`);
    }
    notification.close();
  };

  const nextSettings: AppSettings = {
    ...settings,
    lastNotifiedDate: todayIso
  };
  await saveSettings(nextSettings);

  return { notified: true, count: todayPeople.length };
}

