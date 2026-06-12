import { describe, it, expect } from "vitest";
import {
  isUuidLike,
  normalizeAgentUrlKey,
  hasNonAsciiContent,
  deriveAgentUrlKey,
} from "./agent-url-key";

describe("isUuidLike", () => {
  it("returns true for a valid lowercase UUID", () => {
    expect(isUuidLike("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")).toBe(true);
  });
  it("returns true for a valid uppercase UUID", () => {
    expect(isUuidLike("AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE")).toBe(true);
  });
  it("returns false for a non-UUID string", () => {
    expect(isUuidLike("not-a-uuid")).toBe(false);
  });
  it("returns false for null/undefined", () => {
    expect(isUuidLike(null)).toBe(false);
    expect(isUuidLike(undefined)).toBe(false);
  });
  it("trims whitespace before testing", () => {
    expect(isUuidLike("  aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee  ")).toBe(true);
  });
});

describe("normalizeAgentUrlKey", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(normalizeAgentUrlKey("My Agent")).toBe("my-agent");
  });
  it("strips special characters", () => {
    expect(normalizeAgentUrlKey("Agent #1!")).toBe("agent-1");
  });
  it("trims leading/trailing dashes", () => {
    expect(normalizeAgentUrlKey("  ---hello---  ")).toBe("hello");
  });
  it("strips non-ASCII (umlauts, accents, CJK)", () => {
    expect(normalizeAgentUrlKey("Müller")).toBe("m-ller");
    expect(normalizeAgentUrlKey("支持")).toBe(null);
  });
  it("returns null for empty result after normalization", () => {
    expect(normalizeAgentUrlKey("")).toBe(null);
    expect(normalizeAgentUrlKey("---")).toBe(null);
  });
  it("returns null for null/undefined", () => {
    expect(normalizeAgentUrlKey(null)).toBe(null);
    expect(normalizeAgentUrlKey(undefined)).toBe(null);
  });
});

describe("hasNonAsciiContent", () => {
  it("returns true for strings with non-ASCII chars", () => {
    expect(hasNonAsciiContent("Müller")).toBe(true);
    expect(hasNonAsciiContent("支持")).toBe(true);
  });
  it("returns false for pure ASCII strings", () => {
    expect(hasNonAsciiContent("My Agent")).toBe(false);
    expect(hasNonAsciiContent("hello-123")).toBe(false);
  });
  it("returns false for null/undefined", () => {
    expect(hasNonAsciiContent(null)).toBe(false);
    expect(hasNonAsciiContent(undefined)).toBe(false);
  });
});

describe("deriveAgentUrlKey", () => {
  const agentId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  it("returns normalized name for plain ASCII names", () => {
    expect(deriveAgentUrlKey("My Agent")).toBe("my-agent");
    expect(deriveAgentUrlKey("Support")).toBe("support");
  });

  it("appends shortId for non-ASCII names", () => {
    expect(deriveAgentUrlKey("Müller", agentId)).toBe("m-ller-aaaaaaaa");
    expect(deriveAgentUrlKey("支持", agentId)).toBe("aaaaaaaa");
  });

  it("falls back to fallback when name is null/empty", () => {
    expect(deriveAgentUrlKey(null, "Fallback")).toBe("fallback");
    expect(deriveAgentUrlKey(undefined, "Fallback")).toBe("fallback");
    expect(deriveAgentUrlKey("")).toBe("agent");
  });

  it("returns the default 'agent' key when nothing is provided", () => {
    expect(deriveAgentUrlKey(null, null)).toBe("agent");
    expect(deriveAgentUrlKey(undefined, undefined)).toBe("agent");
  });

  it("does NOT append shortId when fallback is not a UUID", () => {
    // "Café" → "caf", non-ASCII present, but fallback is a plain string, not a UUID
    // shortIdFromUuid returns null → fallback to base
    expect(deriveAgentUrlKey("Café", "not-a-uuid")).toBe("caf");
  });
});