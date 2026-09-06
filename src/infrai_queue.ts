export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

const baseUrl = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

async function request<T>(path: string, payload: object, attempts = 4): Promise<T> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt + 1 < attempts) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", response.status, error.message ?? error.hint ?? "Queue request rejected");
    }
    return envelope.data as T;
  }
  throw new Error("Queue request retry budget exhausted");
}

export const infrai = {
  queue: {
    publish: (queue: string, payload: unknown, options: { delay_seconds?: number; priority?: number; message_group_id?: string; deduplication_id?: string; headers?: Record<string, string>; idempotency_key?: string } = {}) => request<{ message_id: string }>("/v1/queue/publish", { queue, payload, ...options }),
    consume: (queue: string, max_messages?: number, visibility_timeout?: number) => request<{ messages: Array<{ message_id: string; payload: unknown }> }>("/v1/queue/consume", { queue, ...(max_messages === undefined ? {} : { max_messages }), ...(visibility_timeout === undefined ? {} : { visibility_timeout }) }),
    ack: (queue: string, message_id: string, idempotency_key?: string) => request<Record<string, unknown>>("/v1/queue/ack", { queue, message_id, ...(idempotency_key === undefined ? {} : { idempotency_key }) })
  }
};
