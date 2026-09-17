import { describe, expect, it } from "vitest";

import { LogoutUseCase } from "../usecase/logout.usecase";

describe("LogoutUseCase", () => {
  it("should execute successfully and return success status", async () => {
    const logoutUseCase = new LogoutUseCase();
    const result = await logoutUseCase.execute();

    expect(result).toEqual({ success: true });
  });
});
