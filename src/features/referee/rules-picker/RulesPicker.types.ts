import type { Rules } from "../../../domain/rules";

export interface RulesPickerProps {
  compact?: boolean;
  onChange?: (rules: Rules) => void;
  rules: Rules;
}
