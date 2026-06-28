import { format } from "date-fns";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { parseLocalDate } from "@/lib/utils";
import type { UpcomingCareLog } from "@/types";

interface MarkAsDoneDialogProps {
  log: UpcomingCareLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
}

/**
 * Confirmation dialog for marking an upcoming-care task as complete.
 * Shows the task's plant, care type, due date, and optional note before confirming.
 */
export function MarkAsDoneDialog({
  log,
  open,
  onOpenChange,
  loading,
  error,
  onConfirm,
}: MarkAsDoneDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mark Care as Complete"
      description="Are you sure you want to mark this care activity as done?"
      confirmLabel="Mark as Done"
      loadingLabel="Marking..."
      variant="default"
      loading={loading}
      error={error}
      onConfirm={onConfirm}
    >
      {log && (
        <div className="space-y-2 py-4">
          <div className="text-sm">
            <span className="font-medium">Plant:</span> {log.plant_nickname}
          </div>
          <div className="text-sm">
            <span className="font-medium">Care Type:</span> {log.care_type}
          </div>
          <div className="text-sm">
            <span className="font-medium">Due Date:</span>{" "}
            {format(parseLocalDate(log.due_date), "PPP")}
          </div>
          {log.note && (
            <div className="text-sm">
              <span className="font-medium">Note:</span> {log.note}
            </div>
          )}
          <div className="text-sm text-muted-foreground pt-2">
            This will be logged as completed today.
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
