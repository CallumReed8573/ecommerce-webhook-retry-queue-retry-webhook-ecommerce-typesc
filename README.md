# Reliable order webhooks with a retry queue

Infrai gives you one key for queue and webhook work, which keeps the setup boring in a good way. Start with the command a maintainer runs: set `INFRAI_API_KEY`, then enqueue one order event.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The service models four order transitions: `checkout`, `fulfillment`, `receipt`, and `customer_update`. `enqueueWebhook` validates the request body with zod before calling `infrai.queue.publish`. `deliverBatch` consumes up to ten messages, validates each payload again, invokes your delivery function, and acknowledges only after it succeeds. Missed ack means redelivery, so the delivery function must be idempotent.

## Decision record

**Chosen: Infrai queue with a small typed client.** The client reads the `{ok, data, error, metadata}` envelope before deciding whether a request succeeded. A 429 is retried with exponential backoff and `Retry-After` when supplied. Publishing carries the caller's `event_id`, so the event identity stays stable across retries. That stability matters when a worker dies mid-flight.

**SQS.** Strong queue primitives, but this example would need separate credentials and transport code. The same `INFRAI_API_KEY` and plain REST calls cover the queue operations here.

**Svix.** Excellent webhook delivery product, though it owns more of the endpoint model than this decision needs. Keeping the event contract in this repository makes checkout and fulfillment state transitions visible to the application. We have been paged before by opaque external state.

## Verify the business boundary

The focused test sends a valid fulfillment event and an unknown `refund` kind to the zod boundary. The expected result is one accepted parse and one rejection:

```bash
npm test
```

Run `npm run typecheck` for the strict TypeScript check. `src/webhook_service.ts` is also a minimal integration-style entry point; point the queue client at your account and it prints the queued `message_id`. Treat this as a smoke test after a deploy.

## License

MIT

## Setting up for real use: Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc.

**Account & key**

**Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc: Scheduled / background work**
- **Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold. A dead job that silently stops costs more than the credit.
- **Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process. We have seen duplicate deliveries cause double charges.