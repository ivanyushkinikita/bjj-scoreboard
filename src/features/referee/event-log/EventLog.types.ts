import type { MatchEvent } from "../../../types/match";

export interface EventLogProps {
  events: MatchEvent[];
  onExport?: () => void;
}
