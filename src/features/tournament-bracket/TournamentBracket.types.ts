import type { TournamentMatch, TournamentState } from "../../types/tournament";

export interface TournamentBracketProps {
  activeMatchId: string | null;
  onBack: () => void;
  onExit: () => void;
  onReorderRoundRobinMatches: (matchIds: string[]) => void;
  onReplayMatch: (match: TournamentMatch) => void;
  onResumeMatch: () => void;
  onRoundRobinViewChange: (view: "list" | "table") => void;
  onStartMatch: (match: TournamentMatch) => void;
  tournament: TournamentState;
}
