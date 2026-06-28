import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CareType } from "@/types";

interface CareTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  careTypes: CareType[];
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  /** Include the care type description in each option label. */
  showDescription?: boolean;
}

/**
 * Care-type picker dropdown.
 * Optionally appends the description to each option.
 */
export function CareTypeSelect({
  value,
  onValueChange,
  careTypes,
  disabled,
  placeholder = "Select care type",
  emptyLabel = "No care types available",
  showDescription = false,
}: CareTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {careTypes.length === 0 ? (
          <SelectItem value="none" disabled>
            {emptyLabel}
          </SelectItem>
        ) : (
          careTypes.map((type) => (
            <SelectItem key={type.id} value={type.id.toString()}>
              {type.name}
              {showDescription && type.description && ` - ${type.description}`}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
