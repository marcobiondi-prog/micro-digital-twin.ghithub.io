// Server-only helper for the OpenAI Responses API (POST /v1/responses).
// Call it only inside server function handlers: it reads secrets from process.env.
// OPENAI_BASE_URL lets you point at any Responses-compatible endpoint
// (Azure OpenAI, OpenRouter, a local proxy, ...).

export function aiConfigured(): boolean {
  return Boolean(process.env["OPENAI_API_KEY"]);
}

export function aiResponses(body: Record<string, unknown>): Promise<Response> {
  const apiKey = process.env["OPENAI_API_KEY"] ?? "";
  const baseUrl = (process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env["OPENAI_MODEL"] ?? "gpt-6-astra";
  return fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, ...body }),
  });
}
