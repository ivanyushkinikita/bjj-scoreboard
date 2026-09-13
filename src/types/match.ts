import type { AthleteColor, Rules } from '../domain/rules';
export type Side = 'A' | 'B';
export type FinishReason = 'time' | 'submission' | 'decision' | 'disqualification' | 'technical';
export type ScoreField = 'points' | 'advantages' | 'penalties';
export type Competitor = { name: string; points: number; advantages: number; penalties: number; color?: AthleteColor };
export type MatchStatus = 'setup' | 'ready' | 'running' | 'paused' | 'finished';
export type MatchEvent = { id: string; timestamp: number; matchTime: number; competitor: Side | null; type: string; value?: number; relatedEventId?: string };
export type ScoreAction = { id: string; side: Side; field: ScoreField; before: number; after: number; label: string; opponentPatch?: {field:ScoreField;before:number;after:number} };
export type MatchState = {
  competitorA: Competitor; competitorB: Competitor;
  rules: Rules; showWinner: boolean; overtimeAttacker: Side | null;
  initialDuration: number; remainingTime: number; endTimestamp: number | null;
  status: MatchStatus; winner: Side | null; result: FinishReason | null;
  confirmed: boolean; events: MatchEvent[]; past: ScoreAction[]; future: ScoreAction[];
};
