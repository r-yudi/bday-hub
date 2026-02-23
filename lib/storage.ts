"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppSettings, BirthdayPerson, SettingRecord } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

type BdayDB = DBSchema & {
  people: {
    key: string;
    value: BirthdayPerson;
  };
  settings: {
    key: string;
    value: SettingRecord;
  };
};

const DB_NAME = "bdayhub-db";
const DB_VERSION = 1;
const LS_PEOPLE_KEY = "bdayhub_people";
const LS_SETTINGS_KEY = "bdayhub_settings";

let dbPromise: Promise<IDBPDatabase<BdayDB>> | null = null;

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function supportsIndexedDb(): boolean {
  return canUseBrowserStorage() && "indexedDB" in window;
}

async function getDb(): Promise<IDBPDatabase<BdayDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BdayDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("people")) {
          db.createObjectStore("people", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      }
    });
  }
  return dbPromise;
}

function lsGetPeople(): BirthdayPerson[] {
  if (!canUseBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LS_PEOPLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lsSetPeople(people: BirthdayPerson[]): void {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(LS_PEOPLE_KEY, JSON.stringify(people));
}

function lsGetSettings(): AppSettings {
  if (!canUseBrowserStorage()) return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(LS_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function lsSetSettings(settings: AppSettings): void {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
}

export async function listPeople(): Promise<BirthdayPerson[]> {
  if (!canUseBrowserStorage()) return [];
  if (!supportsIndexedDb()) return lsGetPeople();

  try {
    const db = await getDb();
    return await db.getAll("people");
  } catch {
    return lsGetPeople();
  }
}

export async function upsertPerson(person: BirthdayPerson): Promise<void> {
  if (!canUseBrowserStorage()) return;
  if (!supportsIndexedDb()) {
    const people = lsGetPeople();
    const idx = people.findIndex((p) => p.id === person.id);
    if (idx >= 0) people[idx] = person;
    else people.push(person);
    lsSetPeople(people);
    return;
  }

  try {
    const db = await getDb();
    await db.put("people", person);
  } catch {
    const people = lsGetPeople();
    const idx = people.findIndex((p) => p.id === person.id);
    if (idx >= 0) people[idx] = person;
    else people.push(person);
    lsSetPeople(people);
  }
}

export async function upsertManyPeople(peopleToUpsert: BirthdayPerson[]): Promise<void> {
  if (!canUseBrowserStorage()) return;
  if (!supportsIndexedDb()) {
    const existing = lsGetPeople();
    const map = new Map(existing.map((p) => [p.id, p]));
    for (const person of peopleToUpsert) map.set(person.id, person);
    lsSetPeople(Array.from(map.values()));
    return;
  }

  try {
    const db = await getDb();
    const tx = db.transaction("people", "readwrite");
    for (const person of peopleToUpsert) {
      await tx.store.put(person);
    }
    await tx.done;
  } catch {
    await upsertManyPeopleFallback(peopleToUpsert);
  }
}

async function upsertManyPeopleFallback(peopleToUpsert: BirthdayPerson[]): Promise<void> {
  const existing = lsGetPeople();
  const map = new Map(existing.map((p) => [p.id, p]));
  for (const person of peopleToUpsert) map.set(person.id, person);
  lsSetPeople(Array.from(map.values()));
}

export async function getPersonById(id: string): Promise<BirthdayPerson | null> {
  const people = await listPeople();
  return people.find((p) => p.id === id) ?? null;
}

export async function deletePerson(id: string): Promise<void> {
  if (!canUseBrowserStorage()) return;
  if (!supportsIndexedDb()) {
    lsSetPeople(lsGetPeople().filter((p) => p.id !== id));
    return;
  }

  try {
    const db = await getDb();
    await db.delete("people", id);
  } catch {
    lsSetPeople(lsGetPeople().filter((p) => p.id !== id));
  }
}

export async function getSettings(): Promise<AppSettings> {
  if (!canUseBrowserStorage()) return { ...DEFAULT_SETTINGS };
  if (!supportsIndexedDb()) return lsGetSettings();

  try {
    const db = await getDb();
    const record = await db.get("settings", "app");
    return { ...DEFAULT_SETTINGS, ...(record?.value as AppSettings | undefined) };
  } catch {
    return lsGetSettings();
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!canUseBrowserStorage()) return;
  if (!supportsIndexedDb()) {
    lsSetSettings(settings);
    return;
  }

  try {
    const db = await getDb();
    await db.put("settings", { key: "app", value: settings });
  } catch {
    lsSetSettings(settings);
  }
}

export async function clearAllData(): Promise<void> {
  if (!canUseBrowserStorage()) return;

  if (supportsIndexedDb()) {
    try {
      const db = await getDb();
      const tx = db.transaction(["people", "settings"], "readwrite");
      await tx.objectStore("people").clear();
      await tx.objectStore("settings").clear();
      await tx.done;
    } catch {
      // fallback below
    }
  }

  window.localStorage.removeItem(LS_PEOPLE_KEY);
  window.localStorage.removeItem(LS_SETTINGS_KEY);
}
