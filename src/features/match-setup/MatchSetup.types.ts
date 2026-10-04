import type { AthleteColor } from "../../domain/rules";

export interface MatchSetupDraft {
  colors: [AthleteColor, AthleteColor];
  competitorA: string;
  competitorB: string;
  duration: number;
}

export interface MatchSetupProps {
  initial?: MatchSetupDraft;
  onBack: () => void;
  onInitialConsumed?: () => void;
}
