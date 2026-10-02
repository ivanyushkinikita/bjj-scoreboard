import { useMemo, useState } from 'react';
import { useTranslation } from '../app/i18n';
import type { TournamentMatch, TournamentState } from '../types/tournament';
import { Modal } from './Modal';

type Athlete = { id: number; name: string; duplicateIndex?: number };

export function tournamentRounds(tournament: TournamentState): TournamentMatch[][] {
  const rounds: TournamentMatch[][] = [];
  const bracketSize = 2 ** Math.ceil(Math.log2(Math.max(2, tournament.seeds.length)));
  let entrants = [...tournament.seeds, ...Array.from({ length: bracketSize - tournament.seeds.length }, () => null)].map(id => ({ id, resolved: true }));
  let round = 0;
  while (entrants.length > 1) {
    const resolvedMatches = Array.from({ length: entrants.length / 2 }, (_, index) => {
      const sourceA = entrants[index * 2];
      const sourceB = entrants[index * 2 + 1];
      const athleteA = sourceA.id;
      const athleteB = sourceB.id;
      const id = `round-${round}-match-${index}`;
      const selectedWinner = tournament.results[id];
      const canResolve = sourceA.resolved && sourceB.resolved;
      const playable = canResolve && athleteA !== null && athleteB !== null;
      const winnerId = !canResolve ? null : playable
        ? selectedWinner === athleteA || selectedWinner === athleteB ? selectedWinner : null
        : athleteA ?? athleteB;
      const resolved = canResolve && (!playable || winnerId !== null);
      return { match: { id, round, index, athleteA, athleteB, winnerId, automatic: canResolve && !playable && winnerId !== null }, entrant: { id: winnerId, resolved } };
    });
    const matches = resolvedMatches.map(item => item.match);
    rounds.push(matches);
    entrants = resolvedMatches.map(item => item.entrant);
    round += 1;
  }
  return rounds;
}

export function TournamentBracket({ tournament, onStartMatch, onExit }: { tournament: TournamentState; onStartMatch: (match: TournamentMatch) => void; onExit: () => void }) {
  const { t } = useTranslation();
  const [confirmExit, setConfirmExit] = useState(false);
  const athletes = useMemo<Athlete[]>(() => {
    const names = tournament.draft.competitors.map(name => name.trim());
    const totals = new Map<string, number>();
    names.filter(Boolean).forEach(name => totals.set(name, (totals.get(name) ?? 0) + 1));
    const seen = new Map<string, number>();
    return names.flatMap((name, id) => {
      if (!name) return [];
      const duplicateIndex = (seen.get(name) ?? 0) + 1;
      seen.set(name, duplicateIndex);
      return [{ id, name, duplicateIndex: totals.get(name)! > 1 ? duplicateIndex : undefined }];
    });
  }, [tournament.draft.competitors]);
  const athletesById = useMemo(() => new Map(athletes.map(athlete => [athlete.id, athlete])), [athletes]);
  const rounds = useMemo(() => tournamentRounds(tournament), [tournament]);
  const champion = rounds.at(-1)?.[0]?.winnerId ?? null;
  const label = (id: number | null) => {
    const athlete = id === null ? null : athletesById.get(id);
    return athlete ? <>{athlete.name}{athlete.duplicateIndex && <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>}</> : <span className="tournament-empty">—</span>;
  };

  return <main className="tournament-board" aria-labelledby="tournament-board-title">
    <div className="tournament-board-head">
      <div><div className="eyebrow">{t('TOURNAMENT')}</div><h1 id="tournament-board-title">{tournament.draft.name}</h1><p>{t('Click a match to start the timer.')}</p></div>
      <div className="tournament-board-actions">{champion !== null && <div className="tournament-champion"><span>{t('Champion')}</span><strong>{label(champion)}</strong></div>}<button onClick={() => setConfirmExit(true)}>{t('Exit')}</button></div>
    </div>
    <section className="tournament-map" aria-label={t('Tournament bracket')}>
      {rounds.map((matches, roundIndex) => <section className="tournament-round" key={roundIndex}>
        <h2>{roundIndex === rounds.length - 1 ? t('Final') : `${t('Round')} ${roundIndex + 1}`}</h2>
        <div className="tournament-round-matches">{matches.filter(match => match.athleteA !== null || match.athleteB !== null).map(match => {
          const playable = match.athleteA !== null && match.athleteB !== null && match.winnerId === null;
          return <button key={match.id} className={`tournament-match ${match.winnerId !== null ? 'complete' : ''} ${playable ? 'playable' : ''}`} disabled={!playable} onClick={() => onStartMatch(match)}>
            <span className={`tournament-athlete slot-${tournament.draft.matchColors[0]} ${match.winnerId === match.athleteA ? 'winner' : ''}`}>{label(match.athleteA)}</span>
            <span className={`tournament-athlete slot-${tournament.draft.matchColors[1]} ${match.winnerId === match.athleteB ? 'winner' : ''}`}>{label(match.athleteB)}</span>
            <small>{match.automatic ? t('Automatic advance') : match.winnerId !== null ? t('Completed') : playable ? t('Start match') : t('Awaiting opponent')}</small>
          </button>;
        })}</div>
      </section>)}
    </section>
    {confirmExit && <Modal title="Leave tournament" close={() => setConfirmExit(false)}><p>{t('Leave this tournament and return to the mode selection?')}</p><div className="dialog-actions"><button onClick={() => setConfirmExit(false)}>{t('Cancel')}</button><button className="primary" onClick={onExit}>{t('Leave tournament')}</button></div></Modal>}
  </main>;
}
