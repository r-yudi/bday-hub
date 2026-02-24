"use client";

import { birthdayCategoriesFromAny } from "@/lib/categories";
import { getTodayPeople, getUpcomingPeople } from "@/lib/dates";
import { getSafeBrowserSession, getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  deletePerson as deleteLocalPerson,
  getPersonById as getLocalPersonById,
  listPeople as listLocalPeople,
  upsertManyPeople as upsertManyLocalPeople,
  upsertPerson as upsertLocalPerson
} from "@/lib/storage";
import type { BirthdayPerson } from "@/lib/types";

type BirthdaysRow = {
  id: string;
  user_id: string;
  name: string;
  day: number;
  month: number;
  categories?: string[] | null;
  category?: string | null;
  source?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  other_link?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export type SyncResult = {
  ok: boolean;
  syncedCount: number;
  message?: string;
};

function normalizePerson(person: BirthdayPerson): BirthdayPerson {
  const now = Date.now();
  const categories = birthdayCategoriesFromAny(person);
  return {
    ...person,
    id: person.id || crypto.randomUUID(),
    categories,
    category: categories[0] || undefined,
    tags: categories,
    source: person.source || "manual",
    createdAt: Number.isFinite(person.createdAt) ? person.createdAt : now,
    updatedAt: Number.isFinite(person.updatedAt) ? person.updatedAt : now
  };
}

function rowToPerson(row: BirthdaysRow): BirthdayPerson {
  const now = Date.now();
  const createdAt = row.created_at ? Date.parse(row.created_at) : now;
  const updatedAt = row.updated_at ? Date.parse(row.updated_at) : createdAt;
  const categories = birthdayCategoriesFromAny(row);
  return {
    id: row.id,
    name: row.name,
    day: Number(row.day),
    month: Number(row.month),
    source: row.source === "csv" || row.source === "shared" ? row.source : "manual",
    categories,
    category: categories[0] ?? undefined,
    tags: categories,
    notes: row.notes ?? undefined,
    links: {
      whatsapp: row.whatsapp ?? undefined,
      instagram: row.instagram ?? undefined,
      other: row.other_link ?? undefined
    },
    createdAt: Number.isFinite(createdAt) ? createdAt : now,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : now
  };
}

function personToRow(person: BirthdayPerson, userId: string): BirthdaysRow {
  const normalized = normalizePerson(person);
  return {
    id: normalized.id,
    user_id: userId,
    name: normalized.name,
    day: normalized.day,
    month: normalized.month,
    categories: normalized.categories ?? [],
    category: normalized.category ?? null,
    source: normalized.source,
    tags: normalized.categories ?? normalized.tags ?? [],
    notes: normalized.notes ?? null,
    whatsapp: normalized.links?.whatsapp ?? null,
    instagram: normalized.links?.instagram ?? null,
    other_link: normalized.links?.other ?? null,
    created_at: new Date(normalized.createdAt).toISOString(),
    updated_at: new Date(normalized.updatedAt).toISOString()
  };
}

async function getCurrentAuthUserId() {
  const { session } = await getSafeBrowserSession();
  return session?.user?.id ?? null;
}

async function listRemoteBirthdays(userId: string): Promise<BirthdayPerson[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("birthdays")
    .select("*")
    .order("month", { ascending: true })
    .order("day", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as BirthdaysRow[])
    .filter((row) => row.user_id === userId)
    .map(rowToPerson);
}

async function upsertRemoteBirthdays(userId: string, people: BirthdayPerson[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  if (people.length === 0) return;

  const rows = people.map((person) => personToRow(person, userId));
  const { error } = await supabase.from("birthdays").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

async function deleteRemoteBirthday(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.from("birthdays").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function mergePeople(localPeople: BirthdayPerson[], remotePeople: BirthdayPerson[]): BirthdayPerson[] {
  const map = new Map<string, BirthdayPerson>();

  const insert = (person: BirthdayPerson) => {
    const normalized = normalizePerson(person);
    const existing = map.get(normalized.id);
    if (!existing) {
      map.set(normalized.id, normalized);
      return;
    }

    const existingUpdated = Number.isFinite(existing.updatedAt) ? existing.updatedAt : 0;
    const candidateUpdated = Number.isFinite(normalized.updatedAt) ? normalized.updatedAt : 0;
    if (candidateUpdated >= existingUpdated) {
      map.set(normalized.id, normalized);
    }
  };

  for (const person of remotePeople) insert(person);
  for (const person of localPeople) insert(person.id ? person : { ...person, id: crypto.randomUUID() });

  return Array.from(map.values());
}

async function isLoggedInForRemote() {
  const userId = await getCurrentAuthUserId();
  return userId;
}

export async function listBirthdays(): Promise<BirthdayPerson[]> {
  const userId = await isLoggedInForRemote();
  if (!userId) return listLocalPeople();
  return listRemoteBirthdays(userId);
}

export async function listToday() {
  const people = await listBirthdays();
  return getTodayPeople(people);
}

export async function listUpcoming(days = 7) {
  const people = await listBirthdays();
  return getUpcomingPeople(people, new Date(), days);
}

export async function getBirthdayById(id: string): Promise<BirthdayPerson | null> {
  const userId = await isLoggedInForRemote();
  if (!userId) return getLocalPersonById(id);
  const people = await listRemoteBirthdays(userId);
  return people.find((person) => person.id === id) ?? null;
}

export async function upsertBirthday(person: BirthdayPerson): Promise<void> {
  const normalized = normalizePerson(person);
  const userId = await isLoggedInForRemote();

  if (!userId) {
    await upsertLocalPerson(normalized);
    return;
  }

  await upsertRemoteBirthdays(userId, [normalized]);
  await upsertLocalPerson(normalized);
}

export async function deleteBirthday(id: string): Promise<void> {
  const userId = await isLoggedInForRemote();
  if (!userId) {
    await deleteLocalPerson(id);
    return;
  }

  await deleteRemoteBirthday(id);
  await deleteLocalPerson(id);
}

export async function importCsv(rows: BirthdayPerson[]): Promise<void> {
  const normalized = rows.map(normalizePerson);
  const userId = await isLoggedInForRemote();
  if (!userId) {
    await upsertManyLocalPeople(normalized);
    return;
  }

  await upsertRemoteBirthdays(userId, normalized);
  await upsertManyLocalPeople(normalized);
}

export const listTodayBirthdays = listToday;
export const listUpcomingBirthdays = listUpcoming;
export const importCsvBirthdays = importCsv;

export async function syncBirthdaysAfterSignIn(): Promise<SyncResult> {
  const userId = await isLoggedInForRemote();
  if (!userId) {
    return { ok: false, syncedCount: 0, message: "Usuário não autenticado." };
  }

  const [localPeople, remotePeople] = await Promise.all([listLocalPeople(), listRemoteBirthdays(userId)]);
  const merged = mergePeople(localPeople, remotePeople);
  await upsertRemoteBirthdays(userId, merged);
  await upsertManyLocalPeople(merged);

  return { ok: true, syncedCount: merged.length };
}

export async function debugTestBirthdaysTable() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, message: "Cliente Supabase indisponível." };
  }
  const { session, errorMessage } = await getSafeBrowserSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, message: errorMessage || "Sem sessão ativa." };
  }

  const countRes = await supabase.from("birthdays").select("*", { count: "exact", head: true });
  if (countRes.error) {
    return { ok: false, message: countRes.error.message };
  }

      const now = Date.now();
      const dummyId = crypto.randomUUID();
      const dummy: BirthdayPerson = {
    id: dummyId,
    name: "__debug_birthdays__",
    day: 1,
        month: 1,
        source: "manual",
        categories: ["debug"],
        tags: ["debug"],
        createdAt: now,
        updatedAt: now
      };
  await upsertRemoteBirthdays(userId, [dummy]);
  const del = await supabase.from("birthdays").delete().eq("id", dummyId);
  if (del.error) {
    return { ok: false, message: del.error.message };
  }

  return { ok: true, count: countRes.count ?? 0 };
}
