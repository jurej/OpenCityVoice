import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/config";

describe("safeNext", () => {
  it("allows relative paths", () => {
    expect(safeNext("/ljubljana/new")).toBe("/ljubljana/new");
  });

  it("blocks open redirects", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext(undefined, "/profile")).toBe("/profile");
  });
});
