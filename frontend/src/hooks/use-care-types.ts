import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultCareTypes, getUserCareTypes } from "@/api/careTypes";
import type { CareType } from "@/types";

export interface UseCareTypesResult {
  careTypes: CareType[];
  defaultCareTypes: CareType[];
  userCareTypes: CareType[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

/**
 * Fetch and merge the system-default and user-created care types.
 *
 * User-types request fails gracefully to an empty list if none exist.
 *
 * Request-id ref so stale responses from older calls (or after unmount)
 * are discarded before touching state.
 */
export function useCareTypes(): UseCareTypesResult {
  const [defaultCareTypes, setDefaultCareTypes] = useState<CareType[]>([]);
  const [userCareTypes, setUserCareTypes] = useState<CareType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current = -1;
    };
  }, []);

  const reload = useCallback(async () => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const [defaultRes, userRes] = await Promise.all([
        getDefaultCareTypes(),
        getUserCareTypes().catch(() => ({ care_types: [] as CareType[] })),
      ]);
      if (id !== requestIdRef.current) return;
      setDefaultCareTypes(defaultRes.care_types ?? []);
      setUserCareTypes(userRes.care_types ?? []);
    } catch (err) {
      if (id !== requestIdRef.current) return;
      console.error("Failed to load care types:", err);
      setError("Failed to load care types");
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const careTypes = useMemo(
    () => [...defaultCareTypes, ...userCareTypes],
    [defaultCareTypes, userCareTypes],
  );

  return {
    careTypes,
    defaultCareTypes,
    userCareTypes,
    loading,
    error,
    reload,
  };
}
