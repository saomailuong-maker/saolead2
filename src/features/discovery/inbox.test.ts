import { describe, expect, it } from "vitest";
import { canAddToInbox } from "./inbox";
describe("Lead Inbox deduplication", () => {
  it("accepts only a result from the search session that is not already present", () => {
    expect(canAddToInbox(["place-1"], "place-1", false)).toBe(true);
    expect(canAddToInbox(["place-1"], "place-1", true)).toBe(false);
    expect(canAddToInbox(["place-1"], "place-2", false)).toBe(false);
  });
});
