import type { ReactElement } from "react";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Custom render function z providerami
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // Możesz dodać tutaj globalne providery jak ThemeProvider, QueryClient itp.
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      // <ThemeProvider theme={theme}>
      //   <QueryClientProvider client={queryClient}>
      <>{children}</>
      //   </QueryClientProvider>
      // </ThemeProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Helper do mockowania localStorage
 */
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  return localStorageMock;
};

/**
 * Helper do mockowania sessionStorage
 */
export const mockSessionStorage = () => {
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorageMock,
    writable: true,
  });

  return sessionStorageMock;
};

/**
 * Helper do mockowania fetch API
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockFetch = (response: any, ok = true) => {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
  });
};

/**
 * Helper do mockowania window.location
 */
export const mockLocation = (url: string) => {
  const mockLocation = {
    href: url,
    origin: new URL(url).origin,
    pathname: new URL(url).pathname,
    search: new URL(url).search,
    hash: new URL(url).hash,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  };

  Object.defineProperty(window, "location", {
    value: mockLocation,
    writable: true,
  });

  return mockLocation;
};

/**
 * Helper do testowania asynchronicznych akcji
 */
export const waitForAsync = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Helper do tworzenia mock event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockEvent = (type: string, props: any = {}) => {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: { value: "" },
    ...props,
  };
};

/**
 * Helper do mockowania IntersectionObserver
 */
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });

  Object.defineProperty(window, "IntersectionObserver", {
    value: mockIntersectionObserver,
  });

  return mockIntersectionObserver;
};

/**
 * Helper do mockowania ResizeObserver
 */
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });

  Object.defineProperty(window, "ResizeObserver", {
    value: mockResizeObserver,
  });

  return mockResizeObserver;
};

/**
 * Helper do mockowania matchMedia
 */
export const mockMatchMedia = (matches = false) => {
  const mockMatchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    value: mockMatchMedia,
  });

  return mockMatchMedia;
};

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };
