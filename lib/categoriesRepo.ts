"use client";

import { PREDEFINED_CATEGORIES, dedupeCategoryNames, normalizeCategoryName } from "@/lib/categories";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { listCategoriesLocal, saveCategoriesLocal } from "@/lib/storage";

const SEEDED_PREFIX = "lembra_categories_seeded_";

type UserCategoryRow = {
  id?: string;
  user_id: string;
  name: string;
  created_at?: string | null;
};

async function getCurrentUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user?.id ?? null;
}

function isDuplicateCategoryError(message?: string) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("duplicate") || lower.includes("unique") || lower.includes("23505");
}

async function listRemoteUserCategories(userId: string): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("user_categories").select("name").eq("user_id", userId).order("name");
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[categories] remote list skipped:", error.message);
    }
    return [];
  }

  return ((data ?? []) as Array<Pick<UserCategoryRow, "name">>).map((row) => row.name);
}

async function insertRemoteUserCategory(userId: string, name: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const normalized = normalizeCategoryName(name);
  if (!normalized) return;

  const { error } = await supabase.from("user_categories").insert({ user_id: userId, name: normalized });
  if (error && !isDuplicateCategoryError(error.message) && process.env.NODE_ENV === "development") {
    console.warn("[categories] remote save skipped:", error.message);
  }
}

function getSeededKey(userId: string) {
  return `${SEEDED_PREFIX}${userId}`;
}

function getSeededFlag(userId: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(getSeededKey(userId)) === "1";
  } catch {
    return false;
  }
}

function setSeededFlag(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getSeededKey(userId), "1");
  } catch {
    // ignore
  }
}

export async function seedDefaultCategories(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || getSeededFlag(userId)) return;

  for (const category of PREDEFINED_CATEGORIES) {
    await insertRemoteUserCategory(userId, category);
  }
  setSeededFlag(userId);
}

export async function listCategories(): Promise<string[]> {
  const local = await listCategoriesLocal();
  const userId = await getCurrentUserId();

  if (userId) {
    await seedDefaultCategories();
  }

  const remote = userId ? await listRemoteUserCategories(userId) : [];
  const merged = dedupeCategoryNames([...PREDEFINED_CATEGORIES, ...local, ...remote]);
  await saveCategoriesLocal(merged);
  return merged;
}

export async function upsertCategory(name: string): Promise<string | null> {
  const normalized = normalizeCategoryName(name);
  if (!normalized) return null;

  const local = await listCategoriesLocal();
  const merged = dedupeCategoryNames([...local, normalized]);
  await saveCategoriesLocal(merged);

  const userId = await getCurrentUserId();
  if (userId) {
    await insertRemoteUserCategory(userId, normalized);
  }

  return normalized;
}

export async function deleteCategory(name?: string): Promise<void> {
  const normalized = normalizeCategoryName(name ?? "");
  if (!normalized) return;

  const local = await listCategoriesLocal();
  const key = normalized.toLocaleLowerCase("pt-BR");
  await saveCategoriesLocal(local.filter((value) => value.toLocaleLowerCase("pt-BR") !== key));

  const userId = await getCurrentUserId();
  if (!userId) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.from("user_categories").delete().eq("user_id", userId).eq("name", normalized);
  if (error && process.env.NODE_ENV === "development") {
    console.warn("[categories] remote delete skipped:", error.message);
  }
}

// Backward-compatible aliases while migrating callers.
export const listCategoryOptions = listCategories;
export const saveCustomCategory = upsertCategory;
