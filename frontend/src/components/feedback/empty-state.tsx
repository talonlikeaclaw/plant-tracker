import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  message: string;
  /** Optional sub-text shown beneath the message. */
  hint?: string;
  /** Optional call-to-action. */
  action?: ReactNode;
}

/**
 * A centered empty-state placeholder rendered as a card.
 * Optionally includes a CTA button to guide the user toward the next action.
 */
export function EmptyState({ message, hint, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent>
        <div className="py-8 text-center space-y-3">
          <div className="space-y-1">
            <p className="text-muted-foreground">{message}</p>
            {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
          </div>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
