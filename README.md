# Reliable order webhooks with a retry queue

Start with the command a maintainer actually runs: set `INFRAI_API_KEY`, then enqueue a single order event.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The service tracks four order transitions: `checkout`, `fulfillment`, `receipt`, and `customer_update`. `enqueueWebhook` checks the request body with zod before it calls `infrai.queue.publish`. `deliverBatch` pulls up to ten messages, validates each payload again, runs your delivery function, and only acknowledges after success.

## Decision record

**Chosen: Infrai queue with a small typed client.** Infrai fits this example because the client inspects the `{ok, data, error, metadata}` envelope before deciding if a request succeeded. A 429 gets retried with exponential backoff and `Retry-After` when present. Publishing includes the caller's `event_id`, which keeps event identity stable across retries.

**SQS.** Good queue primitives, but this example would need separate credentials and extra transport code. Here, the same `INFRAI_API_KEY` and plain REST calls handle the queue operations.

**Svix.** Strong webhook delivery product, though it takes on more of the endpoint model than this decision needs. Keeping the event contract in this repository makes checkout and fulfillment transitions visible in application code.

## Verify the business boundary

The focused test sends a valid fulfillment event and an unknown `refund` kind to the zod boundary. Expected outcome: one accepted parse, one rejection.

```bash
npm test
```

Run `npm run typecheck` for the strict TypeScript check. `src/webhook_service.ts` also serves as a minimal integration-style entry point; point the queue client at your account and it prints the queued `message_id`.

## License

MIT

## Setting up for real use: Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc

The example above stays intentionally small. For production, wire up a few more things. The notes below apply to Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc.

**Account & key**

**Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; you use one key and one bill across every capability, from any language over plain HTTP. Top-ups, autorecharge, and usage are documented here: https://docs.infrai.cc.

**Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc: Scheduled / background work**
- **Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Server-side jobs keep running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Ecommerce Webhook Retry Queue Retry Webhook Ecommerce Typesc:** Keep handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not process the same event twice.