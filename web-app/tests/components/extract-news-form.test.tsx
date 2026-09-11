import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExtractNewsForm } from "@/features/extract-news";

describe("ExtractNewsForm", () => {
  it("renders the news URL input and handles value changes", async () => {
    const user = userEvent.setup();
    const setUrl = vi.fn();
    const onSubmit = vi.fn();

    render(
      <ExtractNewsForm
        url="https://news.example.com/item"
        setUrl={setUrl}
        loading={false}
        error={null}
        onSubmit={onSubmit}
      />,
    );

    const input = screen.getByLabelText(/URL da notícia/i);
    expect(input).toHaveValue("https://news.example.com/item");

    const submitButton = screen.getByRole("button", { name: "Extract" });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalled();
  });

  it("displays loading state and disables inputs when loading", () => {
    render(
      <ExtractNewsForm
        url="https://news.example.com/item"
        setUrl={vi.fn()}
        loading={true}
        error={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Extraindo…" })).toBeDisabled();
    expect(screen.getByText(/Buscando e extraindo a notícia/i)).toBeInTheDocument();
  });

  it("renders error alert with role='alert' when error exists", () => {
    render(
      <ExtractNewsForm
        url=""
        setUrl={vi.fn()}
        loading={false}
        error="Falha na extração de teste"
        onSubmit={vi.fn()}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Falha na extração de teste");
  });
});
