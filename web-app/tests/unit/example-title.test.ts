import { describe, expect, it } from "vitest";

import { InvalidExampleTitleError } from "@/server/domain/errors/invalid-example-title-error";
import { ExampleTitle } from "@/server/domain/value-objects/example-title";

describe("ExampleTitle", () => {
  it("trims a valid title", () => {
    expect(ExampleTitle.create("  Valid title  ").content).toBe("Valid title");
  });
  it("rejects a short title", () => {
    expect(() => ExampleTitle.create("no")).toThrow(InvalidExampleTitleError);
  });
});
