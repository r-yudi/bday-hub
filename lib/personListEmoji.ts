const AVATAR_EMOJIS = ["🎉", "🥳", "🎂", "✨", "🎈", "💐"] as const;

/** Stable celebratory emoji from person id (lists / cards). */
export function emojiForPersonId(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_EMOJIS[Math.abs(sum) % AVATAR_EMOJIS.length] ?? "🎂";
}
