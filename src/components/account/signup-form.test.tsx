import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CartProvider } from "@/lib/cart-context";
import { SignupForm } from "./signup-form";
import { updateUserMock, signUpMock, emitAuthStateChange } from "@/test/supabase-mock";

function renderSignup() {
  return render(
    <CartProvider>
      <SignupForm />
    </CartProvider>,
  );
}

async function fillAndSubmit(email: string, password: string) {
  const submit = screen.getByRole("button", { name: /Create account/ });
  await waitFor(() => expect(submit).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(submit);
}

describe("SignupForm — validation", () => {
  it("rejects a password under 8 characters without calling Supabase at all", async () => {
    renderSignup();
    await fillAndSubmit("test@example.com", "short");
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(signUpMock).not.toHaveBeenCalled();
  });
});

describe("SignupForm — anonymous session (the common case: cart already has items)", () => {
  it("links the existing anonymous session via updateUser, so auth.uid() — and the cart keyed to it — carries over", async () => {
    renderSignup();
    await fillAndSubmit("test@example.com", "password123");
    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith(
        { email: "test@example.com", password: "password123" },
        { emailRedirectTo: expect.stringContaining("/checkout") },
      ),
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("shows a 'check your email' state instead of assuming instant conversion — this project requires confirmation", async () => {
    renderSignup();
    await fillAndSubmit("test@example.com", "password123");
    expect(
      await screen.findByText(/We've sent a confirmation link to/),
    ).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows the real Supabase error and stays on the form when signup fails", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Email already registered" },
    });
    renderSignup();
    await fillAndSubmit("test@example.com", "password123");
    await waitFor(() =>
      expect(screen.getByText("Email already registered")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/We've sent a confirmation link to/)).toBeNull();
  });
});

describe("SignupForm — already a real, non-anonymous account", () => {
  it("calls signUp instead of updateUser — there is no anonymous cart session to preserve", async () => {
    renderSignup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create account/ })).not.toBeDisabled(),
    );
    act(() => {
      emitAuthStateChange("SIGNED_IN", {
        user: { id: "user-2", is_anonymous: false, email: "real@example.com" },
      });
    });

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "another@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Create account/ }));

    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith({
        email: "another@example.com",
        password: "password123",
        options: { emailRedirectTo: expect.stringContaining("/checkout") },
      }),
    );
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
