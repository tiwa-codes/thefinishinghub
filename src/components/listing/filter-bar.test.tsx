import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./filter-bar";
import { DEFAULT_LISTING_FILTERS, type ListingFilterOptions } from "@/lib/listing-filters";
import { routerPushMock, pathnameMock } from "@/test/navigation-mock";

const OPTIONS: ListingFilterOptions = {
  finishes: ["Walnut", "Oak"],
  colors: ["Grey"],
  sizes: [],
};

function renderBar(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  pathnameMock.mockReturnValue("/furniture/bedroom");
  return render(
    <FilterBar
      countLabel="3 pieces"
      filterOptions={OPTIONS}
      activeFilters={DEFAULT_LISTING_FILTERS}
      {...overrides}
    />,
  );
}

describe("FilterBar — dimension visibility", () => {
  it("only renders a dimension dropdown for real, distinct values that exist", () => {
    renderBar();
    expect(screen.getByRole("button", { name: /^Finish/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Color/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Size/ })).toBeNull();
  });

  it("shows the real result count", () => {
    renderBar();
    expect(screen.getByText("3 pieces")).toBeInTheDocument();
  });
});

describe("FilterBar — In Stock toggle", () => {
  it("navigates with inStock=1 when toggled on", () => {
    renderBar();
    fireEvent.click(screen.getByRole("button", { name: "In Stock" }));
    expect(routerPushMock).toHaveBeenCalledWith("/furniture/bedroom?inStock=1");
  });

  it("navigates with inStock removed when toggled back off", () => {
    renderBar({ activeFilters: { ...DEFAULT_LISTING_FILTERS, inStock: true } });
    fireEvent.click(screen.getByRole("button", { name: "In Stock" }));
    expect(routerPushMock).toHaveBeenCalledWith("/furniture/bedroom");
  });
});

describe("FilterBar — multi-select dimensions", () => {
  it("opens the Finish dropdown and checking a value navigates with it in the URL", () => {
    renderBar();
    fireEvent.click(screen.getByRole("button", { name: /^Finish/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Walnut" }));
    expect(routerPushMock).toHaveBeenCalledWith("/furniture/bedroom?finish=Walnut");
  });

  it("combines multiple active dimensions with AND in the resulting URL", () => {
    renderBar({
      activeFilters: { ...DEFAULT_LISTING_FILTERS, inStock: true, finish: ["Walnut"] },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Color/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Grey" }));
    const url = new URL(routerPushMock.mock.calls[0][0], "http://x");
    expect(url.searchParams.get("inStock")).toBe("1");
    expect(url.searchParams.get("finish")).toBe("Walnut");
    expect(url.searchParams.get("color")).toBe("Grey");
  });

  it("unchecking a selected value removes it rather than clearing the whole dimension", () => {
    renderBar({ activeFilters: { ...DEFAULT_LISTING_FILTERS, finish: ["Walnut", "Oak"] } });
    fireEvent.click(screen.getByRole("button", { name: /^Finish/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Walnut" }));
    expect(routerPushMock).toHaveBeenCalledWith("/furniture/bedroom?finish=Oak");
  });
});

describe("FilterBar — price range", () => {
  it("applies a min/max price range to the URL in Naira", () => {
    renderBar();
    fireEvent.click(screen.getByRole("button", { name: /^Price/ }));
    fireEvent.change(screen.getByLabelText("Minimum price in Naira"), {
      target: { value: "50000" },
    });
    fireEvent.change(screen.getByLabelText("Maximum price in Naira"), {
      target: { value: "150000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(routerPushMock).toHaveBeenCalledWith(
      "/furniture/bedroom?priceMin=50000&priceMax=150000",
    );
  });
});

describe("FilterBar — sort", () => {
  it("navigates with the chosen sort value", () => {
    renderBar();
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "price-asc" } });
    expect(routerPushMock).toHaveBeenCalledWith("/furniture/bedroom?sort=price-asc");
  });

  it("omits sort from the URL entirely for the default Featured order", () => {
    renderBar({ activeFilters: { ...DEFAULT_LISTING_FILTERS, sort: "price-asc" } });
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "featured" } });
    expect(routerPushMock).toHaveBeenCalledWith("/furniture/bedroom");
  });
});

describe("FilterBar — preserved params", () => {
  it("keeps an unrelated param (like /search's ?q=) when building a new URL", () => {
    renderBar({ preserveParams: { q: "brass pendant" } });
    fireEvent.click(screen.getByRole("button", { name: "In Stock" }));
    const url = new URL(routerPushMock.mock.calls[0][0], "http://x");
    expect(url.searchParams.get("q")).toBe("brass pendant");
    expect(url.searchParams.get("inStock")).toBe("1");
  });
});
