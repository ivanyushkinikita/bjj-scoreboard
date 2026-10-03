import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from '../app/i18n';
import type { TournamentMatch, TournamentState } from '../types/tournament';
import { Modal } from './Modal';

type Athlete = { id: number; name: string; duplicateIndex?: number };
export type RoundRobinStanding = { athleteId: number; played: number; wins: number; losses: number };
const pairKey = (athleteA: number | null, athleteB: number | null) => athleteA === null || athleteB === null ? '' : [athleteA, athleteB].sort((left, right) => left - right).join(':');

function balancedFirstRoundSeeds(seeds: (number | null)[]) {
  const athletes = seeds.filter((id): id is number => id !== null);
  const bracketSize = 2 ** Math.ceil(Math.log2(Math.max(2, athletes.length)));
  const firstRoundMatches = bracketSize / 2;
  const extraAthletes = athletes.length - firstRoundMatches;
  let cursor = 0;

  // Spread byes across round one. This prevents a competitor from being
  // advanced through an empty second-round branch straight into the final.
  return Array.from({ length: firstRoundMatches }, (_, index) => {
    const pair: (number | null)[] = [athletes[cursor++] ?? null];
    pair.push(index < extraAthletes ? athletes[cursor++] ?? null : null);
    return pair;
  }).flat();
}

export function tournamentRounds(tournament: TournamentState): TournamentMatch[][] {
  const rounds: TournamentMatch[][] = [];
  let entrants: { id: number | null; resolved: boolean }[] = balancedFirstRoundSeeds(tournament.seeds).map(id => ({ id, resolved: true }));
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

export function roundRobinRounds(tournament: TournamentState): TournamentMatch[][] {
  const athletes = Array.from(new Set(tournament.seeds.filter((id): id is number => id !== null)));
  if (athletes.length < 2) return [];
  const rotation: (number | null)[] = athletes.length % 2 === 0 ? [...athletes] : [...athletes, null];
  const rounds: TournamentMatch[][] = [];
  for (let round = 0; round < rotation.length - 1; round += 1) {
    const matches = Array.from({ length: rotation.length / 2 }, (_, index) => {
      const athleteA = rotation[index];
      const athleteB = rotation[rotation.length - 1 - index];
      const id = `round-robin-${round}-match-${index}`;
      const selectedWinner = tournament.results[id];
      return { id, round, index, athleteA, athleteB, winnerId: selectedWinner === athleteA || selectedWinner === athleteB ? selectedWinner : null, automatic: false };
    }).filter(match => match.athleteA !== null && match.athleteB !== null);
    rounds.push(matches);
    rotation.splice(1, 0, rotation.pop()!);
  }
  return rounds;
}

export function roundRobinStandings(tournament: TournamentState, rounds = roundRobinRounds(tournament)): RoundRobinStanding[] {
  const standings = new Map<number, RoundRobinStanding>();
  for (const athleteId of new Set(tournament.seeds.filter((id): id is number => id !== null))) standings.set(athleteId, { athleteId, played: 0, wins: 0, losses: 0 });
  for (const match of rounds.flat()) {
    if (match.winnerId === null || match.athleteA === null || match.athleteB === null) continue;
    const winner = standings.get(match.winnerId)!;
    const loser = standings.get(match.winnerId === match.athleteA ? match.athleteB : match.athleteA)!;
    winner.played += 1; winner.wins += 1;
    loser.played += 1; loser.losses += 1;
  }
  return [...standings.values()].sort((left, right) => right.wins - left.wins || right.played - left.played || left.athleteId - right.athleteId);
}

export function TournamentBracket({ tournament, activeMatchId, onStartMatch, onReplayMatch, onReorderRoundRobinMatches, onRoundRobinViewChange, onBack, onExit }: { tournament: TournamentState; activeMatchId: string | null; onStartMatch: (match: TournamentMatch) => void; onReplayMatch: (match: TournamentMatch) => void; onReorderRoundRobinMatches: (matchIds: string[]) => void; onRoundRobinViewChange: (view: 'list' | 'table') => void; onBack: () => void; onExit: () => void }) {
  const { t } = useTranslation();
  const [confirmExit, setConfirmExit] = useState(false);
  const roundRobinView = tournament.roundRobinView ?? 'list';
  const [matchToReplay, setMatchToReplay] = useState<TournamentMatch | null>(null);
  const [draggedRoundRobinMatch, setDraggedRoundRobinMatch] = useState<string | null>(null);
  const [roundRobinDropTarget, setRoundRobinDropTarget] = useState<string | null>(null);
  const draggedRoundRobinMatchRef = useRef<string | null>(null);
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
  const rounds = useMemo(() => tournament.draft.format === 'round-robin' ? roundRobinRounds(tournament) : tournamentRounds(tournament), [tournament]);
  const standings = useMemo(() => tournament.draft.format === 'round-robin' ? roundRobinStandings(tournament, rounds) : [], [tournament, rounds]);
  const roundRobinAthleteIds = useMemo(() => Array.from(new Set(tournament.seeds.filter((id): id is number => id !== null))), [tournament.seeds]);
  const roundRobinMatches = useMemo(() => new Map(rounds.flat().map(match => [pairKey(match.athleteA, match.athleteB), match])), [rounds]);
  const roundRobinMatchesWithRound = useMemo(() => rounds.flatMap((matches, round) => matches.map(match => ({ match, round }))), [rounds]);
  const orderedRoundRobinMatches = useMemo(() => {
    const matchesById = new Map(roundRobinMatchesWithRound.map(item => [item.match.id, item]));
    const ordered = (tournament.roundRobinMatchOrder ?? []).flatMap(matchId => {
      const item = matchesById.get(matchId);
      return item ? [item] : [];
    });
    const included = new Set(ordered.map(item => item.match.id));
    return [...ordered, ...roundRobinMatchesWithRound.filter(item => !included.has(item.match.id))];
  }, [roundRobinMatchesWithRound, tournament.roundRobinMatchOrder]);
  const champion = tournament.draft.format === 'single-elimination' ? rounds.at(-1)?.[0]?.winnerId ?? null : null;
  const roundRobinComplete = tournament.draft.format === 'round-robin' && rounds.length > 0 && rounds.flat().every(match => match.winnerId !== null);
  const tournamentWinner = champion ?? (roundRobinComplete ? standings[0]?.athleteId ?? null : null);
  const label = (id: number | null) => {
    const athlete = id === null ? null : athletesById.get(id);
    return athlete ? <>{athlete.name}{athlete.duplicateIndex && <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>}</> : <span className="tournament-empty">—</span>;
  };

  const renderMatch = (match: TournamentMatch) => {
    const isActive = activeMatchId === match.id;
    const playable = match.athleteA !== null && match.athleteB !== null && match.winnerId === null;
    const canOpen = isActive || (activeMatchId === null && playable);
    return <button key={match.id} className={`tournament-match ${match.winnerId !== null ? 'complete' : ''} ${playable ? 'playable' : ''} ${isActive ? 'active' : ''}`} disabled={!canOpen} onClick={() => onStartMatch(match)}>
      <span className={`tournament-athlete slot-${tournament.draft.matchColors[0]} ${match.winnerId === match.athleteA ? 'winner' : ''}`}>{label(match.athleteA)}</span>
      <span className={`tournament-athlete slot-${tournament.draft.matchColors[1]} ${match.winnerId === match.athleteB ? 'winner' : ''}`}>{label(match.athleteB)}</span>
      <small>{isActive ? t('Resume match') : match.automatic ? t('Automatic advance') : match.winnerId !== null ? t('Completed') : playable ? t('Start match') : t('Awaiting opponent')}</small>
    </button>;
  };
  const openRoundRobinMatch = (match: TournamentMatch) => {
    if (match.winnerId !== null) setMatchToReplay(match);
    else onStartMatch(match);
  };
  const clearRoundRobinDrag = () => {
    draggedRoundRobinMatchRef.current = null;
    setDraggedRoundRobinMatch(null);
    setRoundRobinDropTarget(null);
  };
  const moveRoundRobinMatch = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const order = orderedRoundRobinMatches.map(item => item.match.id);
    const sourceIndex = order.indexOf(sourceId);
    const targetIndex = order.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, sourceId);
    onReorderRoundRobinMatches(order);
  };
  const roundRobinDropTargetAt = (clientX: number, clientY: number) => document.elementFromPoint(clientX, clientY)?.closest<HTMLTableRowElement>('[data-round-robin-match-id]')?.dataset.roundRobinMatchId ?? null;
  const startRoundRobinDrag = (matchId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    draggedRoundRobinMatchRef.current = matchId;
    setDraggedRoundRobinMatch(matchId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const updateRoundRobinDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const sourceId = draggedRoundRobinMatchRef.current;
    if (!sourceId) return;
    const targetId = roundRobinDropTargetAt(event.clientX, event.clientY);
    setRoundRobinDropTarget(targetId && targetId !== sourceId ? targetId : null);
  };
  const finishRoundRobinDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const sourceId = draggedRoundRobinMatchRef.current;
    const targetId = roundRobinDropTargetAt(event.clientX, event.clientY);
    if (sourceId && targetId && sourceId !== targetId) moveRoundRobinMatch(sourceId, targetId);
    clearRoundRobinDrag();
  };
  const roundRobinAction = (match: TournamentMatch) => {
    const isActive = activeMatchId === match.id;
    const playable = match.athleteA !== null && match.athleteB !== null && match.winnerId === null;
    const canOpen = isActive || (activeMatchId === null && (playable || match.winnerId !== null));
    const text = isActive ? t('Resume match') : match.winnerId !== null ? t('Replay match') : playable ? t('Start match') : t('Awaiting opponent');
    return <button className={`round-robin-action ${match.winnerId !== null ? 'complete' : ''} ${isActive ? 'active' : ''}`} disabled={!canOpen} onClick={() => openRoundRobinMatch(match)}>{text}</button>;
  };
  const standingsTable = <section className="round-robin-standings" aria-label={t('Standings')}>
    <h2>{t('Standings')}</h2>
    <div className="standings-table"><div className="standings-head"><span>#</span><span>{t('Athlete')}</span><span>{t('Wins')}</span><span>{t('Losses')}</span></div>{standings.map((standing, index) => <div className="standings-row" key={standing.athleteId}><strong>{index + 1}</strong><span>{label(standing.athleteId)}</span><span>{standing.wins}</span><span>{standing.losses}</span></div>)}</div>
  </section>;

  return <main className="tournament-board" aria-labelledby="tournament-board-title">
    <div className="tournament-board-head">
      <div><div className="eyebrow">{t('TOURNAMENT')}</div><h1 id="tournament-board-title">{tournament.draft.name}</h1><p>{t(tournament.draft.format === 'round-robin' ? 'Each athlete meets every other athlete once.' : 'Click a match to start the timer.')}</p></div>
      <div className="tournament-board-actions">{champion !== null && <div className="tournament-champion"><span>{t('Champion')}</span><strong>{label(champion)}</strong></div>}{tournament.draft.format === 'single-elimination' && <button onClick={onBack}>{t('Back')}</button>}<button onClick={() => setConfirmExit(true)}>{t('Exit')}</button></div>
    </div>
    {tournament.draft.format === 'round-robin' ? <section className="round-robin-layout"><section className="round-robin-schedule" aria-label={t('Round-robin schedule')}>
      <div className="round-robin-schedule-head"><h2>{t('Round-robin schedule')}</h2><div className="round-robin-view-switch" role="group" aria-label={t('Round-robin view')}><button type="button" className={roundRobinView === 'list' ? 'active' : ''} aria-pressed={roundRobinView === 'list'} onClick={() => onRoundRobinViewChange('list')}>{t('List')}</button><button type="button" className={roundRobinView === 'table' ? 'active' : ''} aria-pressed={roundRobinView === 'table'} onClick={() => onRoundRobinViewChange('table')}>{t('Table')}</button></div></div>
      {roundRobinView === 'list' ? <div className="round-robin-table-wrap"><table><thead><tr><th aria-label={t('Drag to reorder')}/><th>{t('First athlete')}</th><th>{t('Second athlete')}</th><th>{t('Status')}</th></tr></thead><tbody>{orderedRoundRobinMatches.map(({ match }) => <tr data-round-robin-match-id={match.id} key={match.id} className={`${draggedRoundRobinMatch === match.id ? 'round-robin-row-dragging' : ''} ${roundRobinDropTarget === match.id ? 'round-robin-row-drop-target' : ''}`}><td><button type="button" className="round-robin-drag-handle" title={t('Drag to reorder')} aria-label={t('Drag to reorder')} onPointerDown={event => startRoundRobinDrag(match.id, event)} onPointerMove={updateRoundRobinDrag} onPointerUp={finishRoundRobinDrag} onPointerCancel={clearRoundRobinDrag}>↕</button></td><td><span className={`round-robin-athlete slot-${tournament.draft.matchColors[0]} ${match.winnerId === match.athleteA ? 'winner' : ''}`}>{label(match.athleteA)}</span></td><td><span className={`round-robin-athlete slot-${tournament.draft.matchColors[1]} ${match.winnerId === match.athleteB ? 'winner' : ''}`}>{label(match.athleteB)}</span></td><td>{roundRobinAction(match)}</td></tr>)}</tbody></table></div> : <div className="round-robin-matrix-wrap"><table className="round-robin-matrix"><thead><tr><th scope="col">×</th>{roundRobinAthleteIds.map(athleteId => <th key={athleteId} scope="col"><span>{label(athleteId)}</span></th>)}</tr></thead><tbody>{roundRobinAthleteIds.map(rowAthleteId => <tr key={rowAthleteId}><th scope="row">{label(rowAthleteId)}</th>{roundRobinAthleteIds.map(columnAthleteId => {
        if (rowAthleteId === columnAthleteId) return <td className="matrix-self" key={columnAthleteId}><span aria-label={t('Same athlete')}/></td>;
        const match = roundRobinMatches.get(pairKey(rowAthleteId, columnAthleteId));
        if (!match) return <td className="matrix-unavailable" key={columnAthleteId}/>;
        const isActive = activeMatchId === match.id;
        const complete = match.winnerId !== null;
        const canOpen = isActive || activeMatchId === null;
        return <td className={complete ? 'matrix-complete' : isActive ? 'matrix-active' : ''} key={columnAthleteId}><button type="button" disabled={!canOpen} aria-label={`${t('Match')}: ${match.athleteA === null ? '' : athletesById.get(match.athleteA)?.name ?? ''} — ${match.athleteB === null ? '' : athletesById.get(match.athleteB)?.name ?? ''}`} onClick={() => openRoundRobinMatch(match)}>{complete ? <><span aria-hidden="true">✓</span><small>{label(match.winnerId)}</small></> : isActive ? t('Resume match') : t('Start match')}</button></td>;
      })}</tr>)}</tbody></table></div>}
    </section>{standingsTable}</section> : <section className="tournament-map" aria-label={t('Tournament bracket')}>
      {rounds.map((matches, roundIndex) => <section className="tournament-round" key={roundIndex}>
        <h2>{roundIndex === rounds.length - 1 ? t('Final') : `${t('Round')} ${roundIndex + 1}`}</h2>
        <div className="tournament-round-matches">{matches.filter(match => match.athleteA !== null || match.athleteB !== null).map(renderMatch)}</div>
      </section>)}
    </section>}
    {confirmExit && <Modal title="Leave tournament" close={() => setConfirmExit(false)}><p>{t('Leave this tournament and return to the mode selection?')}</p><div className="dialog-actions"><button onClick={() => setConfirmExit(false)}>{t('Cancel')}</button><button className="primary" onClick={onExit}>{t('Leave tournament')}</button></div></Modal>}
    {matchToReplay && <Modal title="Replay round?" close={() => setMatchToReplay(null)}><p>{t('Do you want to replay this round? The recorded result will be replaced.')}</p><div className="dialog-actions"><button onClick={() => setMatchToReplay(null)}>{t('Cancel')}</button><button className="primary" onClick={() => { onReplayMatch(matchToReplay); setMatchToReplay(null); }}>{t('Replay match')}</button></div></Modal>}
    {tournamentWinner !== null && <section className="tournament-finish" role="dialog" aria-modal="true" aria-label={t('Tournament complete')}><div className="tournament-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index}/>)}</div><div className="tournament-finish-content"><span className="tournament-trophy" aria-hidden="true">🏆</span><p>{t('Tournament complete')}</p><h1>{label(tournamentWinner)}</h1><strong>{t('Champion')}</strong><button className="primary" autoFocus onClick={onExit}>{t('Finish tournament')}</button></div></section>}
  </main>;
}
