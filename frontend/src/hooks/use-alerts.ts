import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAlertsResult {
  success: string;
  error: string;
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
  clearSuccess: () => void;
  clearError: () => void;
  clear: () => void;
}

/**
 * Manages the success/error message rendering.
 *
 * By default messages persist until cleared. Pass an `autoClearMs`
 * to automatically dismiss the success message after a delay.
 */
export function useAlerts(autoClearMs?: number): UseAlertsResult {
  const [success, setSuccessState] = useState("");
  const [error, setErrorState] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Clean up pending timer on unmount to avoid state update after unmount
  useEffect(() => cancelTimer, [cancelTimer]);

  const setSuccess = useCallback(
    (message: string) => {
      setErrorState("");
      setSuccessState(message);
      if (autoClearMs) {
        cancelTimer();
        timeoutRef.current = setTimeout(() => {
          setSuccessState("");
          timeoutRef.current = null;
        }, autoClearMs);
      }
    },
    [autoClearMs, cancelTimer],
  );

  const setError = useCallback(
    (message: string) => {
      cancelTimer();
      setSuccessState("");
      setErrorState(message);
    },
    [cancelTimer],
  );

  const clearSuccess = useCallback(() => setSuccessState(""), []);
  const clearError = useCallback(() => setErrorState(""), []);
  const clear = useCallback(() => {
    cancelTimer();
    setSuccessState("");
    setErrorState("");
  }, [cancelTimer]);

  return {
    success,
    error,
    setSuccess,
    setError,
    clearSuccess,
    clearError,
    clear,
  };
}
