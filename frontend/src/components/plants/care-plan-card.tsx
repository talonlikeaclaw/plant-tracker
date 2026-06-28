import { PencilIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, parseLocalDate } from "@/lib/utils";
import type { CarePlan } from "@/types";

interface CarePlanCardProps {
  plan: CarePlan;
  plantName: string;
  careTypeName: string;
  active: boolean;
  onEdit: (plan: CarePlan) => void;
  onDelete: (plan: CarePlan) => void;
}

export function CarePlanCard({
  plan,
  plantName,
  careTypeName,
  active,
  onEdit,
  onDelete,
}: CarePlanCardProps) {
  return (
    <Card className={cn(!active && "opacity-60")}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{plantName}</CardTitle>
            <CardDescription>{careTypeName}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(plan)}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(plan)}>
              <Trash2Icon className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {plan.start_date && (
          <div className="text-sm">
            <span className="font-medium">Start Date:</span>{" "}
            {format(parseLocalDate(plan.start_date), "PPP")}
          </div>
        )}
        {plan.frequency_days && (
          <div className="text-sm">
            <span className="font-medium">Frequency:</span> Every{" "}
            {plan.frequency_days} day{plan.frequency_days !== 1 && "s"}
          </div>
        )}
        {plan.note && (
          <div className="text-sm">
            <span className="font-medium">Note:</span> {plan.note}
          </div>
        )}
        <div className="pt-2">
          {active ? (
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
              Inactive
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
