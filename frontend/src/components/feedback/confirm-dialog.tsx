import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/feedback/status-alerts";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Optional body content between the description and the action buttons. */
  children?: ReactNode;
  confirmLabel?: string;
  /** Label shown while `loading` is true. */
  loadingLabel?: string;
  cancelLabel?: string;
  /** Button variant for the confirm action. */
  variant?: "default" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  /** Optional error message rendered inside the dialog. */
  error?: string;
}

/**
 * Generic confirmation dialog with cancel/confirm actions. Powers all delete
 * and "mark as done" confirmations across the app.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  cancelLabel = "Cancel",
  variant = "destructive",
  loading = false,
  disabled = false,
  onConfirm,
  error,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {error && <ErrorAlert message={error} />}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading || disabled}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
