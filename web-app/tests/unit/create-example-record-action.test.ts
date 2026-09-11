import { describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@/server/composition-root", () => ({
  createExampleRecordController: () => ({ create: createMock }),
}));

import { createExampleRecordAction } from "@/features/example/actions/create-example-record.action";

describe("createExampleRecordAction", () => {
  it("returns a success message after creating a valid record", async () => {
    createMock.mockResolvedValueOnce({ title: "Valid title" });
    const formData = new FormData();
    formData.set("title", "Valid title");

    await expect(
      createExampleRecordAction({ isSuccess: false, message: "" }, formData),
    ).resolves.toEqual({
      isSuccess: true,
      message: 'Created "Valid title".',
    });
  });

  it("returns a safe error for invalid input", async () => {
    const formData = new FormData();
    formData.set("title", "no");

    await expect(
      createExampleRecordAction({ isSuccess: false, message: "" }, formData),
    ).resolves.toMatchObject({
      isSuccess: false,
    });
  });

  it("does not expose an unknown failure", async () => {
    createMock.mockRejectedValueOnce("unexpected");
    const formData = new FormData();
    formData.set("title", "Valid title");

    await expect(
      createExampleRecordAction({ isSuccess: false, message: "" }, formData),
    ).resolves.toEqual({
      isSuccess: false,
      message: "Unable to create the example record.",
    });
  });
});
