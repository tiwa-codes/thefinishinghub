import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ResetPasswordForm } from "./reset-password-form";
import { emitAuthStateChange, updateUserMock } from "@/test/supabase-mock";

describe("ResetPasswordForm — gating", () => {
  it("hides the form until a PASSWORD_RECOVERY auth event fires", async () => {
    render(<ResetPasswordForm />);
    expect(screen.getByText("Verifying your reset link…")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).toBeNull();

    act(() => {
      emitAuthStateChange("PASSWORD_RECOVERY", { user: { id: "user-1" } });
    });

    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
  });

  it("does not reveal the form for an unrelated auth event — every visitor has a plain anonymous session", () => {
    render(<ResetPasswordForm />);

    act(() => {
      emitAuthStateChange("SIGNED_IN", { user: { id: "user-1", is_anonymous: true } });
    });

    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByText("Verifying your reset link…")).toBeInTheDocument();
  });
});

describe("ResetPasswordForm — submission", () => {
  it("updates the password and shows a success state linking to sign in", async () => {
    render(<ResetPasswordForm />);
    act(() => {
      emitAuthStateChange("PASSWORD_RECOVERY", { user: { id: "user-1" } });
    });

    fireEvent.change(await screen.findByLabelText("New password"), {
      target: { value: "newpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Set new password/ }));

    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith({ password: "newpassword123" }),
    );
    expect(await screen.findByText(/Your password has been updated/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/account/login",
    );
  });

  it("rejects a password under 8 characters without calling Supabase", async () => {
    render(<ResetPasswordForm />);
    act(() => {
      emitAuthStateChange("PASSWORD_RECOVERY", { user: { id: "user-1" } });
    });

    fireEvent.change(await screen.findByLabelText("New password"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Set new password/ }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
