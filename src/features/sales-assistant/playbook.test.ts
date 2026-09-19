import { describe, expect, it } from "vitest";
import { objectionPlaybook } from "./playbook";

describe("objection playbook", () => {
  it("never tells the owner to abandon Facebook", () => { expect(objectionPlaybook.facebook_enough.response).toContain("tiếp tục dùng"); expect(objectionPlaybook.facebook_enough.response).not.toMatch(/bỏ Facebook/i); });
  it("never tells the owner to abandon OTA", () => { expect(objectionPlaybook.already_on_ota.response).toContain("không cần rời OTA"); });
  it("states that a website does not create traffic automatically", () => { expect(objectionPlaybook.website_no_traffic.response).toContain("Website không tự tạo traffic."); });
});
