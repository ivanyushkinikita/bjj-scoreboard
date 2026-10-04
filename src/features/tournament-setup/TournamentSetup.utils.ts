import type { AthleteColor } from "../../domain/rules";

export const athleteColors: AthleteColor[] = ["red", "blue", "white"];
export const dragSourceMime = "application/x-tatami-athlete";

export const initialCompetitors = () => Array.from({ length: 4 }, () => "");

export const nextPowerOfTwo = (value: number) =>
  2 ** Math.ceil(Math.log2(Math.max(2, value)));
