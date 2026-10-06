import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "@/features/register";
import { DEFAULT_AVATAR } from "@/lib/avatar";

const mocks = vi.hoisted(() => ({ register: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/api/auth/actions/register.action", () => ({ registerAction: mocks.register }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  // jsdom does not implement native dialog presentation; browser behavior is covered by Playwright.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

function fillRegistration() {
  fireEvent.change(screen.getByRole("textbox", { name: /Nome ou Nickname/ }), {
    target: { value: "Maria" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /E-mail/ }), {
    target: { value: "maria@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: "Olimpo@2025" } });
}

describe("registration", () => {
  it("edits the avatar and preserves password visibility controls", async () => {
    render(<RegisterForm />);
    fireEvent.click(screen.getByRole("button", { name: "Editar avatar" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Feminino" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar avatar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const password = screen.getByLabelText(/^Senha/);
    fireEvent.change(password, { target: { value: "Olimpo@2025" } });
    expect(screen.getByText("Senha forte")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("shows action errors and submits the default avatar with registration", async () => {
    mocks.register
      .mockResolvedValueOnce({ success: false, error: "Cadastro indisponivel" })
      .mockResolvedValueOnce({ success: true });
    const { container } = render(<RegisterForm />);
    fillRegistration();
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Cadastro indisponivel");
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.register).toHaveBeenCalledWith({
      name: "Maria",
      email: "maria@example.com",
      password: "Olimpo@2025",
      avatar: DEFAULT_AVATAR,
    });
  });

  it("submits all saved avatar choices and discards cancelled edits", async () => {
    mocks.register.mockResolvedValue({ success: true });
    const { container } = render(<RegisterForm />);
    fillRegistration();
    fireEvent.click(screen.getByRole("button", { name: "Editar avatar" }));
    fireEvent.click(screen.getByRole("button", { name: "Feminino" }));
    fireEvent.click(screen.getByRole("button", { name: "Pele retinta" }));
    fireEvent.click(screen.getByRole("button", { name: "Armadura heroica" }));
    fireEvent.click(screen.getByRole("button", { name: "Coroa real" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar avatar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Editar avatar" }));
    expect(screen.getByRole("button", { name: "Feminino" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Masculino" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(mocks.register).toHaveBeenCalledWith({
        name: "Maria",
        email: "maria@example.com",
        password: "Olimpo@2025",
        avatar: { gender: "female", skin: "#593d32", outfit: "armor", headwear: "hat" },
      }),
    );
  });
});
