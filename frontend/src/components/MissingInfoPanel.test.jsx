import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MissingInfoPanel from "./MissingInfoPanel.jsx";

const sufficientResult = {
  needs_follow_up: false,
  missing_information: [],
  follow_up_question: null,
};

const ambiguousResult = {
  needs_follow_up: true,
  missing_information: ["Whether other employees are affected", "When it started"],
  follow_up_question: "Are other employees nearby experiencing the same problem?",
};

describe("MissingInfoPanel", () => {
  it("renders nothing when the ticket is sufficient and nothing is missing", () => {
    const { container } = render(
      <MissingInfoPanel result={sufficientResult} onSubmitAnswer={vi.fn()} isLoading={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the 'more information required' flag for an ambiguous ticket", () => {
    render(<MissingInfoPanel result={ambiguousResult} onSubmitAnswer={vi.fn()} isLoading={false} />);
    expect(screen.getByText(/more information required/i)).toBeInTheDocument();
  });

  it("lists every missing information item", () => {
    render(<MissingInfoPanel result={ambiguousResult} onSubmitAnswer={vi.fn()} isLoading={false} />);
    expect(screen.getByText("Whether other employees are affected")).toBeInTheDocument();
    expect(screen.getByText("When it started")).toBeInTheDocument();
  });

  it("shows the follow-up question and calls onSubmitAnswer with the trimmed answer", () => {
    const onSubmitAnswer = vi.fn();
    render(<MissingInfoPanel result={ambiguousResult} onSubmitAnswer={onSubmitAnswer} isLoading={false} />);

    expect(
      screen.getByText("Are other employees nearby experiencing the same problem?")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/type your answer/i), {
      target: { value: "  No, only my laptop.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(onSubmitAnswer).toHaveBeenCalledWith("No, only my laptop.");
  });

  it("does not submit an empty answer", () => {
    const onSubmitAnswer = vi.fn();
    render(<MissingInfoPanel result={ambiguousResult} onSubmitAnswer={onSubmitAnswer} isLoading={false} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("disables the answer input and button while loading", () => {
    render(<MissingInfoPanel result={ambiguousResult} onSubmitAnswer={vi.fn()} isLoading={true} />);
    expect(screen.getByPlaceholderText(/type your answer/i)).toBeDisabled();
  });
});
