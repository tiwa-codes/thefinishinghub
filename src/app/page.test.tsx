import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Home from "@/app/page";
import { CartProvider } from "@/lib/cart-context";

function renderHome() {
  return render(
    <CartProvider>
      <Home />
    </CartProvider>,
  );
}

describe("Home page", () => {
  it("has no product carousel anywhere", () => {
    const { container } = renderHome();
    expect(
      container.querySelector('[aria-roledescription="carousel"]'),
    ).toBeNull();
    expect(container.querySelector('[class*="carousel" i]')).toBeNull();
    expect(container.querySelector('[class*="slider" i]')).toBeNull();
  });

  it("shows the real contact facts verbatim in the Visit section", () => {
    renderHome();
    const showroom = document.getElementById("showroom");
    expect(showroom).not.toBeNull();
    const scoped = within(showroom as HTMLElement);
    expect(
      scoped.getByText(
        "Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District, Abuja",
      ),
    ).toBeInTheDocument();
    expect(scoped.getByText("+234 (0) 803 311 7302")).toBeInTheDocument();
    expect(scoped.getByText(/9am–6pm/)).toBeInTheDocument();
  });

  it("mentions Bajgio only inside the footer, not in the body of the page", () => {
    const { container } = renderHome();
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();

    const bodyWithoutFooter = container.cloneNode(true) as HTMLElement;
    bodyWithoutFooter.querySelector("footer")?.remove();
    expect(bodyWithoutFooter.textContent).not.toMatch(/Bajgio/);
    expect(footer?.textContent).toMatch(/Bajgio/);
  });

  it("does not add Interior Design as a 6th entry in the primary category nav", () => {
    renderHome();
    const categoryHeadings = screen.getAllByText(
      /Furniture & Furnishings|Tiles & Wall Finishes|Tiles & Finishes|Lighting|Sanitaryware|Bath|Doors/,
    );
    expect(categoryHeadings.length).toBeGreaterThan(0);

    const primaryNav = screen.getByRole("navigation", {
      name: "Product categories",
    });
    expect(within(primaryNav).queryByText(/Interior Design/)).toBeNull();
  });
});
