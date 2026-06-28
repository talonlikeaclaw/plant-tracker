import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Species } from "@/types";

interface SpeciesSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  species: Species[];
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  /** Include the scientific name in each option label. */
  showScientificName?: boolean;
}

/**
 * Species picker dropdown.
 * Optionally appends the scientific name to each option.
 */
export function SpeciesSelect({
  value,
  onValueChange,
  species,
  disabled,
  placeholder = "Select a species",
  emptyLabel = "No species available",
  showScientificName = false,
}: SpeciesSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {species.length === 0 ? (
          <SelectItem value="none" disabled>
            {emptyLabel}
          </SelectItem>
        ) : (
          species.map((s) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.common_name}
              {showScientificName &&
                s.scientific_name &&
                ` (${s.scientific_name})`}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
