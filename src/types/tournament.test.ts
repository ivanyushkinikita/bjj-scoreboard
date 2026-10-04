import { describe, expect, it } from "vitest";
import {
  normalizeSpectatorAnimationPreset,
  normalizeSpectatorBackground,
  normalizeSpectatorLogo,
  spectatorAnimationPresets,
  spectatorBackgrounds,
} from "./tournament";

describe("spectator animation presets", () => {
  it("keeps only the supported presentation presets", () => {
    expect(spectatorAnimationPresets).toEqual(["arena-dust", "cinematic"]);
  });

  it("falls back to arena dust for values stored by older or unknown versions", () => {
    expect(normalizeSpectatorAnimationPreset("unknown-preset")).toBe(
      "arena-dust",
    );
    expect(normalizeSpectatorAnimationPreset("floating-embers")).toBe(
      "arena-dust",
    );
  });

  it("migrates retired spectator background choices to their closest available variants", () => {
    expect(spectatorBackgrounds).toEqual([
      "none",
      "arena-tatami",
      "ribbons-smoke",
      "contour-fog",
      "custom",
    ]);
    expect(normalizeSpectatorBackground("belts-smoke")).toBe("ribbons-smoke");
    expect(normalizeSpectatorBackground("symmetric-smoke")).toBe("contour-fog");
  });

  it("accepts only compact PNG logos stored as data URLs", () => {
    expect(normalizeSpectatorLogo("data:image/png;base64,AA==")).toBe(
      "data:image/png;base64,AA==",
    );
    expect(normalizeSpectatorLogo("data:image/jpeg;base64,AA==")).toBeNull();
  });
});
