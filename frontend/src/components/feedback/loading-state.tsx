import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
}

/**
 * A centered "Loading..." placeholder rendered as a card.
 * Used while a page's primary list/grid is being fetched.
 */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground py-8 text-center">{message}</p>
      </CardContent>
    </Card>
  );
}
