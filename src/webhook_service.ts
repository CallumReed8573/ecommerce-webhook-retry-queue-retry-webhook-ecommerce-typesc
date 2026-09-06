import { z } from "zod";
import { infrai } from "./infrai_queue.js";

export const orderEvent = z.object({
  event_id: z.string().min(1),
  order_id: z.string().min(1),
  kind: z.enum(["checkout", "fulfillment", "receipt", "customer_update"]),
  customer_id: z.string().min(1),
  occurred_at: z.string().datetime()
});
export type OrderEvent = z.infer<typeof orderEvent>;
const queueName = process.env.INFRAI_QUEUE ?? "orders";

export async function enqueueWebhook(input: unknown): Promise<string> {
  const event = orderEvent.parse(input);
  const result = await infrai.queue.publish(queueName, event);
  return result.message_id;
}

export async function deliverBatch(handle: (event: OrderEvent) => Promise<void>): Promise<number> {
  const result = await infrai.queue.consume(queueName, 10, 60);
  let delivered = 0;
  for (const message of result.messages) {
    const event = orderEvent.parse(message.payload);
    await handle(event);
    await infrai.queue.ack(queueName, message.message_id);
    delivered++;
  }
  return delivered;
}

if (process.argv[1]?.endsWith("webhook_service.ts")) {
  const sample = { event_id: "evt_100", order_id: "ord_42", kind: "checkout", customer_id: "cus_9", occurred_at: new Date().toISOString() };
  enqueueWebhook(sample).then((id) => console.log(`queued ${id}`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
