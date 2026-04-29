import { useCallback, useEffect, useRef } from "react";

export interface SessionData {
  page: string;
  step: string;
  data: Record<string, unknown>;
  timestamp: number;
}

const SESSION_KEY = "vani-session-state";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export const useSessionPersistence = (page: string) => {
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);

  const saveSession = useCallback(
    (step: string, data: Record<string, unknown>) => {
      try {
        const sessionData: SessionData = {
          page,
          step,
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      } catch (error) {
        console.warn("Could not save session state:", error);
      }
    },
    [page]
  );

  const loadSession = useCallback((): SessionData | null => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed: SessionData = JSON.parse(raw);
      // Only return if it's for this page and less than 2 hours old
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      if (parsed.page === page && parsed.timestamp > twoHoursAgo) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }, [page]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const startAutosave = useCallback(
    (getState: () => { step: string; data: Record<string, unknown> }) => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
      autosaveRef.current = setInterval(() => {
        const { step, data } = getState();
        saveSession(step, data);
      }, AUTOSAVE_INTERVAL);
    },
    [saveSession]
  );

  const stopAutosave = useCallback(() => {
    if (autosaveRef.current) {
      clearInterval(autosaveRef.current);
      autosaveRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, []);

  return { saveSession, loadSession, clearSession, startAutosave, stopAutosave };
};
