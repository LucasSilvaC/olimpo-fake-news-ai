import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotFoundPage } from "@/views/not-found";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
const router = { replace: mocks.replace };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("not found page", () => {
  it("offers a home link and redirects after eight seconds", () => {
    vi.useFakeTimers();
    render(<NotFoundPage />);
    expect(screen.getByRole("link", { name: /Voltar para o início/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("status")).toHaveTextContent("8s");
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.getByRole("status")).toHaveTextContent("1s");
    expect(mocks.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("cancels the redirect when leaving the page", () => {
    vi.useFakeTimers();
    const { unmount } = render(<NotFoundPage />);
    unmount();
    act(() => vi.advanceTimersByTime(8000));
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
