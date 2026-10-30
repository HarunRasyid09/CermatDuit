// Connection point for the n8n webhook. Set VITE_N8N_WEBHOOK_URL to enable.
export async function sendToAssistant(
  chatInput: string,
  sessionId: string,
): Promise<string> {
  const url = import.meta.env["VITE_N8N_WEBHOOK_URL"] as string | undefined;
  if (!url) throw new Error("Asisten belum terhubung. Webhook n8n belum dikonfigurasi.");
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatInput, sessionId }),
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
  }
  if (!res.ok) throw new Error(`Asisten gagal merespons (${res.status}).`);
  const data = await res.json().catch(() => ({}));
  const reply = data.output ?? data.text ?? data.reply ?? data.message;
  if (typeof reply !== "string") throw new Error("Format jawaban asisten tidak dikenali.");
  return reply;
}
