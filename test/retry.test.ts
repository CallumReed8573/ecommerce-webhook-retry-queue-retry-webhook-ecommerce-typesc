import assert from "node:assert/strict";
import { orderEvent } from "../src/webhook_service.js";

const valid = { event_id: "evt_1", order_id: "ord_1", kind: "fulfillment", customer_id: "cus_1", occurred_at: "2025-01-01T00:00:00.000Z" };
assert.equal(orderEvent.safeParse(valid).success, true);
assert.equal(orderEvent.safeParse({ ...valid, kind: "refund" }).success, false);
console.log("order event boundary: valid events pass, unknown kinds are rejected");
