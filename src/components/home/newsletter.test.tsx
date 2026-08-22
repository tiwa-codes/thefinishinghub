import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { fromMock, makeQueryStub } from "@/test/supabase-mock";
import { Newsletter } from "./newsletter";

function renderNewsletter() {
  return render(<Newsletter />);
}

function subscribeWith(email: string) {
  fireEvent.change(screen.getByPlaceholderText("Email address"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: /Subscribe/ }));
}

describe("Newsletter", () => {
  it("actually submits the email to Supabase, not just preventDefault with no backend", async () => {
    renderNewsletter();
    subscribeWith("reader@example.com");

    await waitFor(() => expect(fromMock).toHaveBeenCalledWith("newsletter_subscribers"));
    const stub = fromMock.mock.results[fromMock.mock.results.length - 1].value;
    expect(stub.insert).toHaveBeenCalledWith({ email: "reader@example.com" });
  });

  it("shows a real confirmation and replaces the form once subscribed", async () => {
    renderNewsletter();
    subscribeWith("reader@example.com");

    expect(await screen.findByText("You're on the list.")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Email address")).toBeNull();
  });

  it("disables the form while the request is in flight", async () => {
    renderNewsletter();
    subscribeWith("reader@example.com");

    // Button flips to a pending label synchronously, before the (mocked,
    // instant) request resolves.
    expect(screen.getByRole("button", { name: "Subscribing…" })).toBeDisabled();
    await screen.findByText("You're on the list.");
  });

  it("treats a repeat signup (unique-email violation) as success, not an error", async () => {
    fromMock.mockReturnValueOnce(
      makeQueryStub({ data: null, error: { code: "23505", message: "duplicate key" } }),
    );
    renderNewsletter();
    subscribeWith("already@example.com");

    expect(await screen.findByText("You're on the list.")).toBeInTheDocument();
    expect(screen.queryByText(/went wrong/)).toBeNull();
  });

  it("shows an honest error message on a real failure, and keeps the form usable", async () => {
    fromMock.mockReturnValueOnce(
      makeQueryStub({ data: null, error: { code: "500", message: "network down" } }),
    );
    renderNewsletter();
    subscribeWith("reader@example.com");

    expect(await screen.findByText("Something went wrong — please try again.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
  });
});
