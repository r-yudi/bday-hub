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

export function buildDailyReminderEmail(names: BirthdayLite[]) {
  const total = names.length;
  const headline = total === 1 ? `Hoje é aniversário de ${names[0].name} 🎉` : `Hoje você tem ${total} aniversários 🎉`;
  const items = names.map((person) => `<li><strong>${person.name}</strong> — ${pad(person.day)}/${pad(person.month)}</li>`).join("");
  const html = [
    `<h2 style="margin:0 0 12px 0;">${headline}</h2>`,
    `<p style="margin:0 0 14px 0;">Abra o Lembra e envie parabéns sem esquecer ninguém.</p>`,
    `<ul style="margin:0 0 16px 18px;padding:0;">${items}</ul>`,
    `<a href="https://uselembra.com.br/today" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#f26452;color:#ffffff;text-decoration:none;font-weight:600;">Abrir Lembra</a>`
  ].join("");

  const textList = names.map((person) => `- ${person.name} (${pad(person.day)}/${pad(person.month)})`).join("\n");
  const text = `${headline}\n\nAbra o Lembra para enviar parabéns.\n\n${textList}\n\nAbrir: https://uselembra.com.br/today`;
  const subject = total === 1 ? `Hoje: aniversário de ${names[0].name} 🎉` : `Hoje: ${total} aniversários no Lembra 🎉`;

  return { subject, html, text };
}
