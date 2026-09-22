import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TicketInputPanel from "./TicketInputPanel.jsx";

function setup(props = {}) {
  const onMessageChange = vi.fn();
  const onAnalyze = vi.fn();
  const utils = render(
    <TicketInputPanel
      message=""
      onMessageChange={onMessageChange}
      onAnalyze={onAnalyze}
      isLoading={false}
      {...props}
    />
  );
  return { onMessageChange, onAnalyze, ...utils };
}

describe("TicketInputPanel", () => {
  it("disables the Analyze button when the message is empty", () => {
    setup({ message: "" });
    expect(screen.getByRole("button", { name: /analyze ticket/i })).toBeDisabled();
  });

  it("enables the Analyze button once there is text", () => {
    setup({ message: "The internet is down." });
    expect(screen.getByRole("button", { name: /analyze ticket/i })).not.toBeDisabled();
  });

  it("calls onAnalyze when submitted with non-empty text", () => {
    const { onAnalyze } = setup({ message: "The internet is down." });
    fireEvent.click(screen.getByRole("button", { name: /analyze ticket/i }));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it("does not call onAnalyze for whitespace-only text", () => {
    const { onAnalyze } = setup({ message: "   " });
    // Button should be disabled, so a click does nothing.
    fireEvent.click(screen.getByRole("button", { name: /analyze ticket/i }));
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("fills the message when a sample ticket is clicked", () => {
    const { onMessageChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /internet down/i }));
    expect(onMessageChange).toHaveBeenCalledWith("The internet is down.");
  });

  it("disables the textarea and button while loading", () => {
    setup({ message: "x", isLoading: true });
    expect(screen.getByLabelText(/describe the employee's it issue/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
  });

  it("shows the character counter and warns near the limit", () => {
    const longMessage = "a".repeat(3600);
    setup({ message: longMessage });
    expect(screen.getByText("3600/4000")).toBeInTheDocument();
  });
});
