import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBanner from "./ErrorBanner.jsx";

describe("ErrorBanner", () => {
  it("renders the message with an alert role", () => {
    render(<ErrorBanner message="Automated analysis is temporarily unavailable." />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Automated analysis is temporarily unavailable."
    );
  });

  it("shows a retry button and calls onRetry when retryable", () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="x" retryable={true} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("hides the retry button when retryable is false", () => {
    render(<ErrorBanner message="x" retryable={false} onRetry={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("hides the retry button when no onRetry handler is given", () => {
    render(<ErrorBanner message="x" retryable={true} />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
