// Unit tests for validation helpers to ensure business rules stay enforced.
import {
  validateRegisterInput,
  validateTicketInput,
  validateCommentInput,
  validateTicketUpdate,
} from "@/lib/validators";

describe("validators", () => {
  test("validateRegisterInput requires name, email, password", () => {
    // Missing fields should trigger an error.
    expect(validateRegisterInput({})).toEqual({
      valid: false,
      error: "Name, email, and password are required",
    });

    // Full payload should be accepted.
    expect(
      validateRegisterInput({ name: "A", email: "a@example.com", password: "x" })
    ).toEqual({ valid: true });
  });

  test("validateTicketInput requires title and description", () => {
    // Title alone is insufficient.
    expect(validateTicketInput({ title: "Only title" })).toEqual({
      valid: false,
      error: "Title and description are required",
    });

    // Both fields should pass.
    expect(
      validateTicketInput({ title: "Bug", description: "Details" })
    ).toEqual({ valid: true });
  });

  test("validateCommentInput requires message", () => {
    // Empty body fails.
    expect(validateCommentInput({})).toEqual({
      valid: false,
      error: "Message is required",
    });
    // Message succeeds.
    expect(validateCommentInput({ message: "Hello" })).toEqual({ valid: true });
  });

  test("validateTicketUpdate allows agents to edit freely", () => {
    expect(
      validateTicketUpdate(
        { status: "resolved", title: "New" },
        "agent",
        "open"
      )
    ).toEqual({ valid: true });
  });

  test("validateTicketUpdate blocks clients when ticket not open", () => {
    // Clients cannot edit closed/resolved tickets.
    expect(
      validateTicketUpdate({ title: "x" }, "client", "resolved")
    ).toEqual({ valid: false, error: "Clients can only edit open tickets" });
  });

  test("validateTicketUpdate blocks clients changing status/priority/assignment", () => {
    // Clients cannot change workflow fields.
    expect(
      validateTicketUpdate(
        { status: "resolved", title: "x" },
        "client",
        "open"
      )
    ).toEqual({
      valid: false,
      error: "Clients cannot change status or assignment",
    });
  });

  test("validateTicketUpdate requires text change for clients", () => {
    // Clients must provide a title/description update.
    expect(validateTicketUpdate({}, "client", "open")).toEqual({
      valid: false,
      error: "Nothing to update",
    });
  });
});
