import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessAlertProps {
  message: string;
  /** Whether to show the leading check icon. Defaults to true. */
  withIcon?: boolean;
}

/**
 * The green success banner used across every page.
 * Rendered only when `message` is non-empty.
 */
export function SuccessAlert({ message, withIcon = true }: SuccessAlertProps) {
  if (!message) return null;
  return (
    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
      {withIcon && (
        <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
      )}
      <AlertDescription className="text-green-800 dark:text-green-200">
        {message}
      </AlertDescription>
    </Alert>
  );
}

interface ErrorAlertProps {
  message: string;
}

/**
 * The destructive error banner used across every page. Rendered only when
 * `message` is non-empty.
 */
export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface StatusAlertsProps {
  success?: string;
  error?: string;
  successIcon?: boolean;
}

/**
 * Convenience wrapper that renders the common success + error pair in order.
 */
export function StatusAlerts({
  success,
  error,
  successIcon = true,
}: StatusAlertsProps) {
  return (
    <>
      {success && <SuccessAlert message={success} withIcon={successIcon} />}
      {error && <ErrorAlert message={error} />}
    </>
  );
}
