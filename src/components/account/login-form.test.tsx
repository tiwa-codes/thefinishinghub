import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./login-form";
import { signInWithPasswordMock } from "@/test/supabase-mock";

describe("LoginForm", () => {
  it("signs in with the entered credentials and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));

    await waitFor(() =>
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret123",
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows a generic incorrect-credentials message on failure, without saying which field was wrong", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));

    await waitFor(() =>
      expect(screen.getByText("Incorrect email or password.")).toBeInTheDocument(),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
