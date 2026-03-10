type BirthdayLite = {
  name: string;
  day: number;
  month: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getDatePartsInTimeZone(timezone: string, now = new Date()) {
  const tryBuild = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(now);

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = tryBuild(timezone);
  } catch {
    parts = tryBuild("America/Sao_Paulo");
  }

  const valueOf = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const year = valueOf("year");
  const month = valueOf("month");
  const day = valueOf("day");
  const hour = valueOf("hour");
  const minute = valueOf("minute");

  return {
    isoDate: `${year}-${month}-${day}`,
    hhmm: `${hour}:${minute}`,
    day: Number(day),
    month: Number(month)
  };
}

const BRAND = "Lembra.";
const APP_URL = "https://uselembra.com.br/today";
const ACCENT_HEX = "#f26452";

function formatDateForLocale(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

/** Deterministic index 0..2 from isoDate (when present) or from total + first name. Stable for tests and retries. */
function subjectVariantIndex(isoDate: string | undefined, total: number, firstName: string): number {
  const seed = isoDate
    ? isoDate.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : total * 31 + (firstName.length > 0 ? firstName.charCodeAt(0) : 0);
  return Math.abs(seed) % 3;
}

const SUBJECT_ONE = [
  (nome: string) => `🎉 Hoje é aniversário de ${nome}`,
  (nome: string) => `Hoje é um bom dia para lembrar de ${nome} 🎂`,
  (nome: string) => `Não deixe passar: hoje é aniversário de ${nome}`
];

const SUBJECT_MANY = [
  (n: number) => `🎉 Hoje ${n} pessoas fazem aniversário`,
  (n: number) => `Hoje é dia de celebrar ${n} pessoas 🎂`,
  (n: number) => `Não deixe passar: ${n} pessoas fazem aniversário hoje`
];

const SUBJECT_ONE_TOMORROW = [
  (nome: string) => `🎂 Amanhã é aniversário de ${nome}`,
  (nome: string) => `Amanhã é um bom dia para lembrar de ${nome} 🎉`,
  (nome: string) => `Não deixe passar: amanhã é aniversário de ${nome}`
];

const SUBJECT_MANY_TOMORROW = [
  (n: number) => `🎂 Amanhã ${n} pessoas fazem aniversário`,
  (n: number) => `Amanhã é dia de lembrar de ${n} pessoas 🎉`,
  (n: number) => `Não deixe passar: ${n} pessoas fazem aniversário amanhã`
];

const SUBJECT_ONE_WEEK = [
  (nome: string) => `🎁 ${nome} faz aniversário em 7 dias`,
  (nome: string) => `Em uma semana é aniversário de ${nome} 🎂`,
  (nome: string) => `Falta uma semana para o aniversário de ${nome}`
];

const SUBJECT_MANY_WEEK = [
  (n: number) => `🎁 ${n} pessoas fazem aniversário em 7 dias`,
  (n: number) => `Em uma semana ${n} pessoas fazem aniversário`,
  (n: number) => `Você tem ${n} aniversários chegando em 7 dias`
];

export function buildDailyReminderEmail(
  names: BirthdayLite[],
  isoDate?: string,
  mode: "today" | "tomorrow" | "week" = "today"
) {
  const total = names.length;
  const isTomorrow = mode === "tomorrow";
  const isWeek = mode === "week";
  const dateLabel = isoDate ? formatDateForLocale(isoDate) : isTomorrow ? "Amanhã" : isWeek ? "Em 7 dias" : "Hoje";

  const PREHEADER = isWeek
    ? "Um aniversário está chegando."
    : isTomorrow
      ? "Amanhã tem aniversário chegando."
      : "Não deixe passar em branco.";
  const idx = subjectVariantIndex(isoDate, total, total > 0 ? names[0].name : "");
  const subject =
    total === 0
      ? `${BRAND} — ${dateLabel}`
      : total === 1
        ? isWeek
          ? SUBJECT_ONE_WEEK[idx](names[0].name)
          : isTomorrow
            ? SUBJECT_ONE_TOMORROW[idx](names[0].name)
            : SUBJECT_ONE[idx](names[0].name)
        : isWeek
          ? SUBJECT_MANY_WEEK[idx](total)
          : isTomorrow
            ? SUBJECT_MANY_TOMORROW[idx](total)
            : SUBJECT_MANY[idx](total);

  const hero =
    total === 0
      ? "Sua lista está tranquila"
      : isWeek
        ? "🎁 Um aniversário está chegando"
        : isTomorrow
          ? "🎂 Amanhã alguém importante faz aniversário"
          : "🎉 Hoje alguém importante faz aniversário";
  const mainMessage =
    total === 0
      ? "Abra o app e confira os próximos dias."
      : total === 1
        ? isWeek
          ? `${names[0].name} faz aniversário em 7 dias.`
          : isTomorrow
            ? `${names[0].name} faz aniversário amanhã.`
            : `${names[0].name} faz aniversário hoje.`
        : isWeek
          ? "Estas pessoas fazem aniversário em 7 dias:"
          : isTomorrow
            ? "Estas pessoas fazem aniversário amanhã:"
            : "Estas pessoas fazem aniversário hoje:";
  const subtext =
    total === 0
      ? "Volte quando quiser e não perca nenhum parabéns."
      : isWeek
        ? "Talvez seja uma boa hora para se preparar."
        : isTomorrow
          ? "Vale se preparar desde já. Um parabéns pode fazer o dia de alguém."
          : "Não deixe esse momento passar. Um parabéns pode transformar o dia de alguém.";
  const ctaLabel = isWeek ? "🎁 Abrir Lembra" : "🎂 Abrir Lembra";

  const items =
    total === 0
      ? ""
      : names
          .map(
            (person) =>
              `<li style="margin:0 0 10px 0;padding:0 0 10px 0;border-bottom:1px solid #eee;list-style:none;font-size:16px;color:#333;"><strong style="color:#1a1a1a;">${person.name}</strong> <span style="color:#666;font-size:14px;">— ${pad(person.day)}/${pad(person.month)}</span></li>`
          )
          .join("");

  const footer = "Lembra. Nunca esqueça quem importa.";
  const html = [
    `<span style="display:none;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${PREHEADER}</span>`,
    `<p style="margin:0 0 24px 0;font-size:11px;color:#888;letter-spacing:0.05em;text-transform:uppercase;">${BRAND}</p>`,
    `<h1 style="margin:0 0 12px 0;font-size:26px;font-weight:700;color:#1a1a1a;line-height:1.2;">${hero}</h1>`,
    `<p style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#333;line-height:1.4;">${mainMessage}</p>`,
    `<p style="margin:0 0 24px 0;font-size:16px;color:#555;line-height:1.5;">${subtext}</p>`,
    total > 0 ? `<ul style="margin:0 0 28px 0;padding:0;list-style:none;border-top:1px solid #eee;padding-top:16px;">${items}</ul>` : "",
    `<a href="${APP_URL}" style="display:inline-block;padding:14px 24px;border-radius:10px;background:${ACCENT_HEX};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">${ctaLabel}</a>`,
    `<p style="margin:28px 0 0 0;font-size:13px;color:#888;">${footer}</p>`
  ]
    .filter(Boolean)
    .join("");

  const textList = total === 0 ? "" : names.map((person) => `• ${person.name} (${pad(person.day)}/${pad(person.month)})`).join("\n");
  const text =
    total === 0
      ? `${BRAND}\n\n${hero}\n\n${mainMessage}\n\n${subtext}\n\n${APP_URL}\n\n${footer}`
      : `${hero}\n\n${mainMessage}\n\n${textList}\n\n${subtext}\n\n${ctaLabel}: ${APP_URL}\n\n${footer}`;

  return { subject, html, text };
}
