import type { ScoringAction } from "../../../domain/rules";

export function savedActions(): ScoringAction[] {
  try {
    const value = JSON.parse(
      localStorage.getItem("tatami.custom-rules.v1") || "[]",
    );

    return Array.isArray(value)
      ? value
          .filter(
            (action) =>
              typeof action?.label === "string" &&
              action.label.trim() &&
              Number.isInteger(action.points) &&
              action.points > 0 &&
              action.points <= 99,
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
