import { useTranslation } from "../../app/i18n";
import singleMatchIcon from "../../assets/single-match-icon.png";
import tournamentIcon from "../../assets/tournament-icon.png";
import {
  Card,
  Cards,
  Eyebrow,
  Icon,
  Intro,
  Screen,
  TournamentCard,
} from "./ModeSelection.styles";
import type { ModeSelectionProps } from "./ModeSelection.types";

export function ModeSelection({
  onSingleMatch,
  onTournament,
}: ModeSelectionProps) {
  const { t } = useTranslation();

  return (
    <Screen aria-labelledby="mode-heading">
      <Intro>
        <Eyebrow>{t("TATAMI CONTROL")}</Eyebrow>
        <h1 id="mode-heading">{t("Choose a mode")}</h1>
        <p>{t("Start one match or prepare a tournament bracket.")}</p>
      </Intro>
      <Cards>
        <Card type="button" onClick={onSingleMatch}>
          <Icon>
            <img src={singleMatchIcon} alt="" />
          </Icon>
          <strong>{t("Single match")}</strong>
        </Card>
        <TournamentCard type="button" onClick={onTournament}>
          <Icon>
            <img src={tournamentIcon} alt="" />
          </Icon>
          <strong>{t("Tournament")}</strong>
        </TournamentCard>
      </Cards>
    </Screen>
  );
}
