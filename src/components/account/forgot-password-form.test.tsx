import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ForgotPasswordForm } from "./forgot-password-form";
import { resetPasswordForEmailMock } from "@/test/supabase-mock";

describe("ForgotPasswordForm", () => {
  it("sends a reset link to the entered address, redirecting to /account/reset-password", async () => {
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reset link/ }));

    await waitFor(() =>
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        "someone@example.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("/account/reset-password") }),
      ),
    );
  });

  it("shows identical confirmation copy on success regardless of whether the account exists — no enumeration leak", async () => {
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reset link/ }));

    expect(
      await screen.findByText(/If an account exists for someone@example\.com/),
    ).toBeInTheDocument();
  });

  it("shows the real error reason (e.g. a rate limit) instead of masking it — no enumeration risk on failure copy", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      data: null,
      error: { message: "email rate limit exceeded" },
    });
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reset link/ }));

    expect(await screen.findByText("email rate limit exceeded")).toBeInTheDocument();
  });
});
