import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/login/ui/login-form";

const mocks = vi.hoisted(() => ({ login: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/api/auth/actions/login.action", () => ({ loginAction: mocks.login }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("login loading", () => {
  it("blocks duplicate submissions while waiting and restores the form on error", async () => {
    let finish!: (value: { success: false; error: string }) => void;
    mocks.login.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { container } = render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password" } });
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    expect(screen.getByRole("status")).toHaveTextContent("Entrando no Olimpo");
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    fireEvent.submit(form);
    expect(mocks.login).toHaveBeenCalledTimes(1);
    finish({ success: false, error: "Credenciais inválidas" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeEnabled();
  });

  it("navigates to the home page after successful authentication", async () => {
    mocks.login.mockResolvedValue({ success: true });
    const { container } = render(<LoginForm />);
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/"));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
