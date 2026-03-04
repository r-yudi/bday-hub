type SendReminderEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

function getSenderAddress() {
  return process.env.REMINDER_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "Lembra <noreply@uselembra.com.br>";
}

export async function sendReminderEmail(input: SendReminderEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing-resend-api-key" } as const;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: getSenderAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, reason: "provider-error", detail: errorText } as const;
  }

  return { ok: true } as const;
}
