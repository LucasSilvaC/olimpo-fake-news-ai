import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ExampleForm } from "@/features/example/components/example-form";

vi.mock("@/features/example/actions/create-example-record.action", () => ({
  createExampleRecordAction: vi.fn(),
}));

describe("ExampleForm", () => {
  it("renders an accessible title input", async () => {
    const user = userEvent.setup();
    render(<ExampleForm />);
    const title = screen.getByLabelText("Title");
    await user.type(title, "Architecture example");
    expect(title).toHaveValue("Architecture example");
    expect(screen.getByRole("button", { name: "Create record" })).toBeEnabled();
  });
});
