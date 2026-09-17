import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/auth", () => ({ getActor: async () => null }));
vi.mock("../actions", () => ({ login: async () => undefined }));

import Login from "./page";

describe("login form", () => {
  it("provides an explicit submit control", async () => {
    const html = renderToStaticMarkup(await Login({ searchParams: Promise.resolve({}) }));
    expect(html).toMatch(/<button[^>]*type="submit"/);
  });
});
