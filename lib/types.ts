export type SourceType = "manual" | "csv" | "shared";

export type PersonLinks = {
  whatsapp?: string;
  instagram?: string;
  other?: string;
};

export type BirthdayPerson = {
  id: string;
  name: string;
  day: number;
  month: number;
  source: SourceType;
  tags: string[];
  notes?: string;
  links?: PersonLinks;
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  notificationEnabled: boolean;
  notificationTime: string;
  lastNotifiedDate?: string;
};

export type SettingRecord<T = unknown> = {
  key: string;
  value: T;
};

export const DEFAULT_SETTINGS: AppSettings = {
  notificationEnabled: false,
  notificationTime: "09:00"
};
