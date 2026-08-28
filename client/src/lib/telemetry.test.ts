import { describe, expect, it, vi } from "vitest";
import { trackVectorForgeEvent } from "./telemetry";

describe("trackVectorForgeEvent", () => {
  it("is a no-op outside a browser", () => {
    expect(() => trackVectorForgeEvent("export_completed", { format: "svg" })).not.toThrow();
  });

  it("forwards an event and explicit metadata when analytics is available", () => {
    const track = vi.fn();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { umami: { track } } });
    trackVectorForgeEvent("collaboration_invite_created", { access: "read" });
    expect(track).toHaveBeenCalledWith("collaboration_invite_created", { access: "read" });
    delete (globalThis as { window?: unknown }).window;
  });
});
