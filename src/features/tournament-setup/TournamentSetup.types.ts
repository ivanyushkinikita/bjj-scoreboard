import type { TournamentDraft, TournamentState } from "../../types/tournament";

export type DragSource =
  | { kind: "pool"; athleteId: number }
  | { kind: "slot"; index: number };

export interface BracketAthlete {
  duplicateIndex?: number;
  id: number;
  name: string;
}

export interface TournamentSetupProps {
  onBack: () => void;
  onStart: (draft: TournamentDraft, placements: (number | null)[]) => void;
  tournament?: TournamentState | null;
}
