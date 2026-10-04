import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "../../app/i18n";
import { Modal, NameInput } from "../../shared/ui";
import type { FreeTournamentProps } from "./FreeTournament.types";

type Athlete = { id: number; name: string; duplicateIndex?: number };

export function FreeTournament({
  tournament,
  activeMatchId,
  onStartMatch,
  onAddAthlete,
  onRemoveAthlete,
  onBack,
  onResumeMatch,
  onExit,
}: FreeTournamentProps) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<[number | null, number | null]>([
    null,
    null,
  ]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropSide, setDropSide] = useState<0 | 1 | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pickerSide, setPickerSide] = useState<0 | 1 | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [winnerPickerOpen, setWinnerPickerOpen] = useState(false);
  const [championId, setChampionId] = useState<number | null>(null);
  const [finishedChampionId, setFinishedChampionId] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const [newAthlete, setNewAthlete] = useState("");
  const draggedRef = useRef<number | null>(null);
  const athletes = useMemo<Athlete[]>(() => {
    const names = tournament.draft.competitors.map((name) => name.trim());
    const totals = new Map<string, number>();
    names
      .filter(Boolean)
      .forEach((name) => totals.set(name, (totals.get(name) ?? 0) + 1));
    const seen = new Map<string, number>();
    return names.flatMap((name, id) => {
      if (!name) return [];
      const duplicateIndex = (seen.get(name) ?? 0) + 1;
      seen.set(name, duplicateIndex);
      return [
        {
          id,
          name,
          duplicateIndex: totals.get(name)! > 1 ? duplicateIndex : undefined,
        },
      ];
    });
  }, [tournament.draft.competitors]);
  const athletesById = useMemo(
    () => new Map(athletes.map((athlete) => [athlete.id, athlete])),
    [athletes],
  );
  const matches = tournament.freeMatches ?? [];
  const standings = useMemo(() => {
    const rows = new Map(
      athletes.map((athlete) => [
        athlete.id,
        { ...athlete, wins: 0, losses: 0 },
      ]),
    );
    for (const match of matches) {
      const winner = rows.get(match.winnerId);
      if (winner) winner.wins += 1;
      const loserId =
        match.winnerId === match.athleteA ? match.athleteB : match.athleteA;
      const loser = rows.get(loserId);
      if (loser) loser.losses += 1;
    }
    return [...rows.values()].sort(
      (left, right) =>
        right.wins - left.wins ||
        left.losses - right.losses ||
        left.name.localeCompare(right.name),
    );
  }, [athletes, matches]);
  const leaderboardLeader = standings[0]?.id ?? null;
  const proposedChampionId = championId ?? leaderboardLeader;
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...matches].reverse().filter((match) => {
      if (!query) return true;
      const names = [
        match.athleteAName ?? athletesById.get(match.athleteA)?.name,
        match.athleteBName ?? athletesById.get(match.athleteB)?.name,
        match.winnerName ?? athletesById.get(match.winnerId)?.name,
      ];
      return names.some((name) => name?.toLocaleLowerCase().includes(query));
    });
  }, [athletesById, matches, search]);
  useEffect(
    () =>
      setSelection(
        (current) =>
          current.map((id) =>
            id !== null && athletesById.has(id) ? id : null,
          ) as [number | null, number | null],
      ),
    [athletesById],
  );
  const label = (id: number | null) => {
    const athlete = id === null ? null : athletesById.get(id);
    return athlete ? (
      <>
        {athlete.name}
        {athlete.duplicateIndex && (
          <sup className="duplicate-marker">{athlete.duplicateIndex}</sup>
        )}
      </>
    ) : (
      <span>{t("Drop athlete here")}</span>
    );
  };
  const clearDrag = () => {
    draggedRef.current = null;
    setDraggedId(null);
    setDropSide(null);
  };
  const place = (id: number, side: 0 | 1) => {
    setSelection((current) => {
      const next: [number | null, number | null] = [...current] as [
        number | null,
        number | null,
      ];
      next[side] = id;
      if (next[1 - side] === id) next[1 - side] = null;
      return next;
    });
    clearDrag();
  };
  const beginDrag = (id: number, event?: DragEvent<HTMLButtonElement>) => {
    if (event) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", String(id));
    }
    draggedRef.current = id;
    setDraggedId(id);
  };
  const idFromDrop = (event: DragEvent<HTMLElement>) => {
    const raw = event.dataTransfer.getData("text/plain").trim();
    const value = Number(raw);
    return raw && Number.isInteger(value) && athletesById.has(value)
      ? value
      : draggedRef.current;
  };
  const pick = (id: number) =>
    place(id, selection[0] === null ? 0 : selection[1] === null ? 1 : 0);
  const addAthlete = () => {
    const name = newAthlete.trim();
    if (!name) return;
    onAddAthlete(name);
    setNewAthlete("");
  };
  const start = () => {
    const [athleteA, athleteB] = selection;
    if (
      athleteA === null ||
      athleteB === null ||
      athleteA === athleteB ||
      activeMatchId
    )
      return;
    onStartMatch({
      id: `free-${Date.now()}`,
      round: 0,
      index: matches.length,
      athleteA,
      athleteB,
      winnerId: null,
      automatic: false,
    });
  };
  return (
    <main className="free-tournament" aria-labelledby="free-tournament-heading">
      <div className="free-tournament-head">
        <button className="back-button" onClick={onBack}>
          {t("Back")}
        </button>
        <div>
          <div className="eyebrow">{t("FREE TOURNAMENT")}</div>
          <h1 id="free-tournament-heading">{tournament.draft.name}</h1>
        </div>
        <div className="free-tournament-actions">
          <button onClick={() => setHistoryOpen(true)}>{t("History")}</button>
          <button
            disabled={activeMatchId !== null || leaderboardLeader === null}
            onClick={() => {
              setChampionId(leaderboardLeader);
              setFinishOpen(true);
            }}
          >
            {t("End tournament")}
          </button>
          <button onClick={() => setConfirmExit(true)}>{t("Exit")}</button>
        </div>
      </div>
      <div className="free-tournament-grid">
        <section
          className="free-panel free-athlete-list"
          aria-labelledby="free-athletes-heading"
        >
          <h2 id="free-athletes-heading">{t("Athletes")}</h2>
          <p>{t("Drag an athlete into a match position.")}</p>
          <div className="free-athlete-scroll">
            {athletes.map((athlete) => (
              <div className="free-athlete-row" key={athlete.id}>
                <button
                  draggable
                  className={draggedId === athlete.id ? "dragging" : ""}
                  onClick={() => pick(athlete.id)}
                  onDragStart={(event) => beginDrag(athlete.id, event)}
                  onDragEnd={clearDrag}
                >
                  {label(athlete.id)}
                </button>
                <button
                  className="free-athlete-remove"
                  disabled={athletes.length <= 2 || activeMatchId !== null}
                  aria-label={`${t("Remove athlete")}: ${athlete.name}`}
                  title={t("Remove athlete")}
                  onClick={() => onRemoveAthlete(athlete.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form
            className="free-add-athlete"
            onSubmit={(event) => {
              event.preventDefault();
              addAthlete();
            }}
          >
            <NameInput
              aria-label={t("Athlete name")}
              maxLength={60}
              placeholder={t("Athlete name")}
              value={newAthlete}
              onChange={setNewAthlete}
            />
            <button disabled={!newAthlete.trim()}>{t("Add athlete")}</button>
          </form>
        </section>
        <section
          className="free-panel free-match-builder"
          aria-labelledby="free-match-heading"
        >
          <h2 id="free-match-heading">{t("Current match")}</h2>
          <p>
            {t(
              "Drag two athletes into the coloured positions, then start the match.",
            )}
          </p>
          <div className="free-match-slots">
            {([0, 1] as const).map((side) => (
              <div className="free-match-slot-wrap" key={side}>
                <button
                  className={`free-match-slot slot-${tournament.draft.matchColors[side]} ${selection[side] !== null ? "filled" : ""} ${dropSide === side ? "drop-target" : ""}`}
                  onClick={() => setPickerSide(side)}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDropSide(side);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                  }}
                  onDragLeave={(event) => {
                    if (event.currentTarget === event.target) setDropSide(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = idFromDrop(event);
                    if (id !== null) place(id, side);
                  }}
                >
                  <small>
                    {t(side === 0 ? "First position" : "Second position")}
                  </small>
                  <strong>{label(selection[side])}</strong>
                </button>
                <button
                  className="free-match-slot-remove"
                  disabled={selection[side] === null}
                  onClick={() =>
                    setSelection((current) => {
                      const next = [...current] as [
                        number | null,
                        number | null,
                      ];
                      next[side] = null;
                      return next;
                    })
                  }
                >
                  {t("Remove from match")}
                </button>
              </div>
            ))}
            <span className="free-match-versus" aria-hidden="true">
              VS
            </span>
          </div>
          {activeMatchId ? (
            <button
              className="primary free-start-match"
              onClick={onResumeMatch}
            >
              {t("Resume match")}
            </button>
          ) : (
            <button
              className="primary free-start-match"
              disabled={
                selection[0] === null ||
                selection[1] === null ||
                selection[0] === selection[1]
              }
              onClick={start}
            >
              {t("Start match")}
            </button>
          )}
        </section>
        <section
          className="free-panel free-leaderboard"
          aria-labelledby="free-leaderboard-heading"
        >
          <h2 id="free-leaderboard-heading">{t("Leaderboard")}</h2>
          <div className="free-leaderboard-table">
            <div className="free-leaderboard-row free-leaderboard-header">
              <span>{t("Athlete")}</span>
              <span>{t("Wins")}</span>
              <span>{t("Losses")}</span>
            </div>
            {standings.map((row) => (
              <div className="free-leaderboard-row" key={row.id}>
                <strong>{label(row.id)}</strong>
                <span>{row.wins}</span>
                <span>{row.losses}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      {historyOpen && (
        <Modal
          title="Match history"
          close={() => setHistoryOpen(false)}
          closeOnBackdrop
        >
          <label className="free-history-search">
            {t("Search match history")}
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Athlete name")}
            />
          </label>
          <div className="free-history-list">
            {filteredHistory.length ? (
              filteredHistory.map((match) => (
                <article key={match.id}>
                  <strong>
                    {match.athleteAName ?? label(match.athleteA)} —{" "}
                    {match.athleteBName ?? label(match.athleteB)}
                  </strong>
                  <span>
                    {t("Winner")}: {match.winnerName ?? label(match.winnerId)}
                  </span>
                  <time>{new Date(match.completedAt).toLocaleString()}</time>
                </article>
              ))
            ) : (
              <p>{t("No matches found.")}</p>
            )}
          </div>
        </Modal>
      )}
      {pickerSide !== null && (
        <Modal
          title="Select athlete"
          close={() => setPickerSide(null)}
          closeOnBackdrop
        >
          <p>{t("Select an athlete for this match position.")}</p>
          <div className="free-picker-options">
            {athletes.map((athlete) => (
              <button
                key={athlete.id}
                className="pool-athlete"
                disabled={selection[1 - pickerSide] === athlete.id}
                onClick={() => {
                  place(athlete.id, pickerSide);
                  setPickerSide(null);
                }}
              >
                {label(athlete.id)}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {finishOpen && proposedChampionId !== null && (
        <Modal
          title="Confirm tournament winner"
          close={() => setFinishOpen(false)}
          closeOnBackdrop
        >
          <p>
            {t("Confirm {name} as the tournament winner?", {
              name: athletesById.get(proposedChampionId)?.name ?? "",
            })}
          </p>
          <div className="dialog-actions free-finish-actions">
            <button
              onClick={() => {
                setFinishOpen(false);
                setWinnerPickerOpen(true);
              }}
            >
              {t("Change winner")}
            </button>
            <button
              className="primary"
              onClick={() => {
                setFinishedChampionId(proposedChampionId);
                setFinishOpen(false);
              }}
            >
              {t("Confirm victory")}
            </button>
          </div>
        </Modal>
      )}
      {winnerPickerOpen && (
        <Modal
          title="Select tournament winner"
          close={() => setWinnerPickerOpen(false)}
          closeOnBackdrop
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (championId !== null) {
                setWinnerPickerOpen(false);
                setFinishOpen(true);
              }
            }}
          >
            <label>
              {t("Winner")}
              <select
                autoFocus
                value={championId ?? ""}
                onChange={(event) => setChampionId(Number(event.target.value))}
              >
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="dialog-actions">
              <button type="button" onClick={() => setWinnerPickerOpen(false)}>
                {t("Cancel")}
              </button>
              <button className="primary" disabled={championId === null}>
                {t("Confirm")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirmExit && (
        <Modal title="Leave tournament" close={() => setConfirmExit(false)}>
          <p>{t("Leave this tournament and return to the mode selection?")}</p>
          <div className="dialog-actions">
            <button onClick={() => setConfirmExit(false)}>{t("Cancel")}</button>
            <button className="primary" onClick={onExit}>
              {t("Exit")}
            </button>
          </div>
        </Modal>
      )}
      {finishedChampionId !== null && (
        <section
          className="tournament-finish"
          role="dialog"
          aria-modal="true"
          aria-label={t("Tournament complete")}
        >
          <div className="tournament-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <div className="tournament-finish-content">
            <span className="tournament-trophy" aria-hidden="true">
              🏆
            </span>
            <p>{t("Tournament complete")}</p>
            <h1>{label(finishedChampionId)}</h1>
            <strong>{t("Champion")}</strong>
            <button className="primary" autoFocus onClick={onExit}>
              {t("Finish tournament")}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
