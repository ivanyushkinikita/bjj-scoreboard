import type { Competitor, Side } from "../../../types/match";

export interface CompetitorPanelProps {
  competitor: Competitor;
  disabled: boolean;
  display: boolean;
  edit: () => void;
  side: Side;
}
