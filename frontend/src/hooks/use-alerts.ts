import { useState } from "react";

export interface UseAlertsResult {
  success: string;
  error: string;
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

/**
 * Manages the success/error message rendering.
 *
 * Messages persist until the next status update.
 */
export function useAlerts(): UseAlertsResult {
  const [success, setSuccessState] = useState("");
  const [error, setErrorState] = useState("");
  const setSuccess = (message: string) => {
    setErrorState("");
    setSuccessState(message);
  };
  const setError = (message: string) => {
    setSuccessState("");
    setErrorState(message);
  };

  return {
    success,
    error,
    setSuccess,
    setError,
  };
}
