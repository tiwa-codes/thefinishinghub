import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signInWithPasswordMock } from "@/test/supabase-mock";
import AdminLoginPage from "./page";

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
}

describe("AdminLoginPage", () => {
  beforeEach(() => {
    // jsdom throws "Not implemented: navigation" on a real assignment —
    // stub location so the post-login `window.location.href = "/admin"`
    // is just a plain, inspectable object write.
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  it("has no signup affordance anywhere on the page", () => {
    render(<AdminLoginPage />);
    expect(screen.queryByText(/sign up/i)).toBeNull();
    expect(screen.queryByText(/create an account/i)).toBeNull();
  });

  it("submits real credentials to signInWithPassword, not a stubbed/fake check", async () => {
    render(<AdminLoginPage />);
    fillAndSubmit("staff@thefinishinghub.com", "correct-password");

    await waitFor(() =>
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "staff@thefinishinghub.com",
        password: "correct-password",
      }),
    );
  });

  it("navigates to /admin on success", async () => {
    render(<AdminLoginPage />);
    fillAndSubmit("staff@thefinishinghub.com", "correct-password");

    await waitFor(() => expect(window.location.href).toBe("/admin"));
  });

  it("shows a generic error on failure — never reveals whether the email exists", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    render(<AdminLoginPage />);
    fillAndSubmit("staff@thefinishinghub.com", "wrong-password");

    expect(await screen.findByText("Incorrect email or password.")).toBeInTheDocument();
    expect(screen.queryByText(/Invalid login credentials/)).toBeNull();
    expect(window.location.href).toBe("");
  });

  it("disables the submit button while the request is in flight", () => {
    render(<AdminLoginPage />);
    fillAndSubmit("staff@thefinishinghub.com", "correct-password");
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });
});
