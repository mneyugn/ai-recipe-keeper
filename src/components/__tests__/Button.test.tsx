import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { expect, test, describe } from "vitest";

// Przykładowy komponent Button do testowania
// Stwórz ten komponent w src/components/ui/Button.tsx jeśli jeszcze nie istnieje
const Button = ({ children, onClick, disabled = false, variant = "primary" }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn btn-${variant}`} data-testid="button">
      {children}
    </button>
  );
};

describe("Button Component", () => {
  test("renderuje się z poprawnym tekstem", () => {
    render(<Button>Kliknij mnie</Button>);

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Kliknij mnie")).toBeInTheDocument();
  });

  test("wywołuje onClick gdy zostanie kliknięty", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Kliknij</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("jest wyłączony gdy disabled=true", () => {
    render(<Button disabled>Wyłączony</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("nie wywołuje onClick gdy jest wyłączony", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Wyłączony
      </Button>
    );

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  test("aplikuje poprawną klasę CSS dla variant", () => {
    render(<Button variant="secondary">Test</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-secondary");
  });

  test("snapshot - wygląd komponentu", () => {
    const { container } = render(<Button variant="primary">Snapshot Test</Button>);

    expect(container.firstChild).toMatchInlineSnapshot(`
      <button
        class="btn btn-primary"
        data-testid="button"
      >
        Snapshot Test
      </button>
    `);
  });
});
