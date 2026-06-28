import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Plant } from "@/types";

interface PlantSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  plants: Plant[];
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}

/**
 * Plant picker dropdown.
 * Renders a disabled placeholder option when there are
 * no plants, otherwise lists every plant by nickname.
 */
export function PlantSelect({
  value,
  onValueChange,
  plants,
  disabled,
  placeholder = "Select a plant",
  emptyLabel = "No plants available",
}: PlantSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {plants.length === 0 ? (
          <SelectItem value="none" disabled>
            {emptyLabel}
          </SelectItem>
        ) : (
          plants.map((plant) => (
            <SelectItem key={plant.id} value={plant.id.toString()}>
              {plant.nickname}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
