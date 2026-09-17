import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("./actions", () => ({ searchBusinesses: async () => ({ results: [] }), addToInbox: async () => undefined }));
import { SearchForm } from "./search-form";
describe("discovery UI", () => { it("renders controlled search inputs and submit", () => { const html = renderToStaticMarkup(<SearchForm/>); expect(html).toContain('name="location"'); expect(html).toContain('name="industry"'); expect(html).toContain('name="maxResults"'); expect(html).toContain('type="submit"'); }); });
