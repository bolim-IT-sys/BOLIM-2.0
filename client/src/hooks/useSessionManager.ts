import { useCallback, useEffect, useRef, useState } from "react";

//const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
//const WARNING_TIME = 5 * 60 * 1000; // 5 minutes
const IDLE_TIMEOUT = 20 * 1000; // 20 sec
const WARNING_TIME = 10 * 1000; // 10 sec

export function useSessionManager() {
  const [showWarning, setShowWarning] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    window.location.href = "/login";
  };

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    const rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe === "true") {
      return; // Stops the timer immediately!
    }

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIMEOUT - WARNING_TIME);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return {
    showWarning,
    stayLoggedIn: () => {
      setShowWarning(false);
      resetTimer();
    },
    logout,
  };
}
