// Basic unit tests for the reusable Button component.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Button } from "@/components/ui/Button";

describe("Button component", () => {
  test("renders with provided text and handles clicks", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    // Render a primary button and verify click handler fires once.
    render(
      <Button onClick={handleClick} aria-label="action-button">
        Click me
      </Button>
    );

    const button = screen.getByLabelText("action-button");
    expect(button).toHaveTextContent("Click me");

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("applies secondary variant styling", () => {
    // Secondary buttons should include the variant class.
    render(
      <Button variant="secondary" aria-label="secondary-button">
        Secondary
      </Button>
    );

    const button = screen.getByLabelText("secondary-button");
    expect(button.className).toMatch(/btn-secondary/);
  });

  test("applies size styling", () => {
    // Size prop should apply the matching size class.
    render(
      <Button size="sm" aria-label="small-button">
        Small
      </Button>
    );

    const button = screen.getByLabelText("small-button");
    expect(button.className).toMatch(/btn-sm/);
  });
});
