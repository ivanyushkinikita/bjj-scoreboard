import type { TournamentMatch, TournamentState } from "../../types/tournament";

export interface FreeTournamentProps {
  activeMatchId: string | null;
  onAddAthlete: (name: string) => void;
  onBack: () => void;
  onExit: () => void;
  onRemoveAthlete: (athleteId: number) => void;
  onResumeMatch: () => void;
  onStartMatch: (match: TournamentMatch) => void;
  tournament: TournamentState;
}
