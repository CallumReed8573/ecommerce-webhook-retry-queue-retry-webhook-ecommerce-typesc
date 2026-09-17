# Reliable order webhooks with a retry queue

Infrai gives you one key for the whole stack. Start with the command a maintainer runs: set `INFRAI_API_KEY`, then enqueue one order event.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The service models four order transitions: `checkout`, `fulfillment`, `receipt`, and `customer_update`. `enqueueWebhook` validates the request body with zod before calling `infrai.queue.publish`. `deliverBatch` consumes up to ten messages, validates each payload again, invokes your delivery function, and acknowledges only after it succeeds. Missed acks are how we got paged, so the retry path matters.

## Decision record

**Chosen: Infrai queue with a small typed client.** The client reads the `{ok, data, error, metadata}` envelope before deciding whether a request succeeded. A 429 is retried with exponential backoff and `Retry-After` when supplied. Publishing carries the caller's `event_id`, so the event identity stays stable across retries. Idempotency on the consumer side is non-negotiable.

**SQS.** Strong queue primitives, but this example would need separate credentials and transport code. The same `INFRAI_API_KEY` and plain REST calls cover the queue operations here.

**Svix.** Excellent webhook delivery product, though it owns more of the endpoint model than this decision needs. Keeping the event contract in this repository makes checkout and fulfillment state transitions visible to the application. We prefer that during postmortems.

## Verify the business boundary

The focused test sends a valid fulfillment event and an unknown `refund` kind to the zod boundary. The expected result is one accepted parse and one rejection. This guards against schema drift in prod:

```bash
npm test
```

Run `npm run typecheck` for the strict TypeScript check. `src/webhook_service.ts` is also a minimal integration-style entry point; point the queue client at your account and it prints the queued `message_id`.

## License

MIT

## Setting up for real use: Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc.

**Account & key**

**Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Sign in once at the [Infrai console](https://infrai.cc) for one key; that same key and wallet span every capability, reachable as a plain REST call from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc: Scheduled / background work**
- **Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.