// Server-Side Rendering (SSR) DOM Shims
//
// Reown AppKit (@reown/appkit) utilizes Lit Web Components (@lit/reactive-element),
// which requires HTMLElement and customElements to be present in the global scope
// during module evaluation in Node.js server environments (e.g. Vercel Serverless Functions).
//
// We shim HTMLElement and customElements so Lit's class inheritance succeeds
// without defining document/window (which would break SSR detection in libraries like sonner).

export function initSsrShims() {
  if (typeof globalThis.HTMLElement === "undefined") {
    (globalThis as unknown as { HTMLElement: unknown }).HTMLElement = class HTMLElement {};
  }

  if (typeof globalThis.customElements === "undefined") {
    (globalThis as unknown as { customElements: unknown }).customElements = {
      get: () => undefined,
      define: () => {},
      whenDefined: () => Promise.resolve(),
    };
  }
}

initSsrShims();

