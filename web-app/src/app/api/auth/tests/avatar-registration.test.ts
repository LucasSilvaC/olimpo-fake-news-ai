import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerAction } from "../actions/register.action";

import { AvatarConfig, DEFAULT_AVATAR } from "@/lib/avatar";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("../usecase/register.usecase", () => ({
  RegisterUseCase: class {
    execute = execute;
  },
}));

const credentials = { name: "Athena", email: "athena@example.com", password: "password123" };
const avatar: AvatarConfig = {
  gender: "female",
  skin: "#885638",
  outfit: "cape",
  headwear: "hat",
};

describe("Avatar registration validation", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue({ user: { id: "athena-id", name: "Athena" } });
  });

  it("passes a selected avatar from a structured input to the use case", async () => {
    expect((await registerAction({ ...credentials, avatar })).success).toBe(true);
    expect(execute).toHaveBeenCalledWith({ ...credentials, avatar });
  });

  it("accepts a JSON avatar submitted with FormData", async () => {
    const form = new FormData();
    Object.entries(credentials).forEach(([key, value]) => form.set(key, value));
    form.set("avatar", JSON.stringify(avatar));
    expect((await registerAction(form)).success).toBe(true);
    expect(execute).toHaveBeenCalledWith({ ...credentials, avatar });
  });

  it("continues to accept registrations without an avatar", async () => {
    expect((await registerAction(credentials)).success).toBe(true);
    expect(execute).toHaveBeenCalledWith(credentials);
  });

  it.each([
    { ...DEFAULT_AVATAR, gender: "invalid" },
    { ...DEFAULT_AVATAR, skin: "#ffffff" },
    { ...DEFAULT_AVATAR, outfit: "invalid" },
    { ...DEFAULT_AVATAR, headwear: "invalid" },
    { gender: "female" },
    null,
  ])("rejects an invalid avatar without invoking the use case: %j", async (invalidAvatar) => {
    const result = await registerAction({ ...credentials, avatar: invalidAvatar as AvatarConfig });
    expect(result).toEqual({
      success: false,
      error: "Confira as opções do seu avatar e tente novamente.",
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects malformed avatar JSON without invoking the use case", async () => {
    const form = new FormData();
    Object.entries(credentials).forEach(([key, value]) => form.set(key, value));
    form.set("avatar", "{invalid");
    expect((await registerAction(form)).success).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });
});
