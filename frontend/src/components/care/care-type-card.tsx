import { PencilIcon, Trash2Icon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CareType } from "@/types";

interface CareTypeCardProps {
  careType: CareType;
  onEdit: (careType: CareType) => void;
  onDelete: (careType: CareType) => void;
}

export function CareTypeCard({
  careType,
  onEdit,
  onDelete,
}: CareTypeCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{careType.name}</CardTitle>
            {careType.description && (
              <CardDescription>{careType.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(careType)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(careType)}
            >
              <Trash2Icon className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
