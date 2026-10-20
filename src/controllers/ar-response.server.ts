export class ArGatewayError extends Error {
  constructor(public status: number, message: string, public persistent = false) {
    super(message);
  }
}

export function gatewayError(status: number, payload: unknown) {
  const p = payload as { message?: string; error?: { message?: string; type?: string }; type?: string } | null;
  const message = p?.message ?? p?.error?.message ?? `Servizio AI non disponibile (${status}).`;
  return new ArGatewayError(status, message, status === 402 || status === 403);
}

/** Consume complete SSE frames, including errors/refusals and split UTF-8 chunks. No replay. */
export async function readArResponse(response: Response) {
  if (!response.ok) {
    throw gatewayError(response.status, await response.json().catch(() => null));
  }
  if (!response.body) throw new ArGatewayError(502, "Il servizio AI non ha restituito una risposta.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", text = "", completed = false;
  const consume = (frame: string) => {
    const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
    if (!data || data === "[DONE]") return;
    const event = JSON.parse(data);
    if (event.type === "response.output_text.delta") text += event.delta ?? "";
    if (event.type === "response.refusal.delta" || event.type === "response.refusal.done")
      throw new ArGatewayError(422, event.refusal ?? event.delta ?? "Il servizio ha rifiutato questa analisi.");
    if (event.type === "error" || event.type === "response.failed") {
      const error = event.response?.error ?? event.error ?? event;
      const status = error.status ?? (error.code === "permission_error" ? 403 : 502);
      throw gatewayError(status, { error });
    }
    if (event.type === "response.incomplete") throw new ArGatewayError(502, "Analisi incompleta. Nessun nuovo risultato applicato.");
    if (event.type === "response.completed") completed = true;
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!completed || !text.trim()) throw new ArGatewayError(502, "Il servizio non ha restituito un risultato completo.");
    return text;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}