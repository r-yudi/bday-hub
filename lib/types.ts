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
  categories?: string[];
  category?: string;
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

export type ReminderTiming = "day_of" | "day_before";

export type EmailReminderSettings = {
  emailEnabled: boolean;
  emailTime: string;
  timezone: string;
  reminderTiming: ReminderTiming;
  lastDailyEmailSentOn?: string | null;
};

export type PushSettings = {
  pushEnabled: boolean;
};

export type LastEmailDispatch = {
  dateKey: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
} | null;

export type SettingRecord<T = unknown> = {
  key: string;
  value: T;
};

export const DEFAULT_SETTINGS: AppSettings = {
  notificationEnabled: false,
  notificationTime: "09:00"
};

export const DEFAULT_EMAIL_REMINDER_SETTINGS: EmailReminderSettings = {
  emailEnabled: false,
  emailTime: "09:00",
  timezone: "America/Sao_Paulo",
  reminderTiming: "day_of",
  lastDailyEmailSentOn: null
};
