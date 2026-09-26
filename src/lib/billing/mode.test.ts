import { describe, expect, it } from "vitest";
import { paymentsMode } from "./mode";

describe("paymentsMode", () => {
  it("uses Stripe whenever a key is set", () => {
    expect(paymentsMode({ STRIPE_SECRET_KEY: "sk_test_x", NODE_ENV: "production" })).toBe("stripe");
  });
  it("simulates payments in development without a key", () => {
    expect(paymentsMode({ NODE_ENV: "development" })).toBe("demo");
  });
  it("never simulates in production unless explicitly enabled", () => {
    expect(paymentsMode({ NODE_ENV: "production" })).toBe("off");
    expect(paymentsMode({ NODE_ENV: "production", PAYMENTS_MODE: "demo" })).toBe("demo");
  });
  it("can be switched off in development", () => {
    expect(paymentsMode({ NODE_ENV: "development", PAYMENTS_MODE: "off" })).toBe("off");
  });
});
